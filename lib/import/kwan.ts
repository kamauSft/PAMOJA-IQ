import ExcelJS from "exceljs";
import type { ParsedContribution, ParsedMember, WorkbookRead } from "./workbook";

/**
 * KWAN keeps years of funeral collections in one wide sheet: the first two
 * columns are the register, then every second column is one bereavement event.
 * The normal monthly reader cannot see that shape, so this adapter turns each
 * event into member/month amounts the ledger already understands.
 */

const SHEET_NAME = /detailed data|^data$/i;
const TOTALS = new Set(["ACTUAL", "TARGET", "DUE", "ACHIEVED", "TOTALS", "TOTAL"]);
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const DAY = 24 * 60 * 60 * 1000;

function raw(cell: ExcelJS.Cell): unknown {
  const value = cell.value;
  if (value && typeof value === "object" && "result" in value) return value.result;
  if (value && typeof value === "object" && "text" in value) return value.text;
  return value;
}

function text(cell: ExcelJS.Cell): string {
  const value = raw(cell);
  return value === null || value === undefined ? "" : String(value).trim();
}

function amount(cell: ExcelJS.Cell): number | null {
  const value = raw(cell);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    if (!cleaned || cleaned === "-") return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function periodFrom(value: unknown): { period?: string; year?: string } {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { period: value.toISOString().slice(0, 7) };
  }
  if (typeof value === "number" && Number.isFinite(value) && value > 20_000 && value < 80_000) {
    return { period: new Date(EXCEL_EPOCH + Math.floor(value) * DAY).toISOString().slice(0, 7) };
  }
  const label = String(value ?? "").trim();
  if (!label) return {};
  const yearOnly = label.match(/^(19|20)\d{2}$/);
  if (yearOnly) return { year: yearOnly[0] };
  const firstDate = label.split(/[-/–—]/).slice(0, 3).join("-");
  const parsed = Date.parse(firstDate);
  if (!Number.isNaN(parsed)) return { period: new Date(parsed).toISOString().slice(0, 7) };
  const named = label.match(/([A-Za-z]{3,})\s+\d{1,2},?\s+((?:19|20)\d{2})/);
  if (named) {
    const month = Date.parse(`${named[1]} 1, ${named[2]}`);
    if (!Number.isNaN(month)) return { period: new Date(month).toISOString().slice(0, 7) };
  }
  return {};
}

function eventColumns(sheet: ExcelJS.Worksheet): number[] {
  const header = sheet.getRow(4);
  const deceased = sheet.getRow(1);
  const columns: number[] = [];
  for (let col = 3; col <= sheet.columnCount; col += 1) {
    const heading = text(header.getCell(col)).toUpperCase();
    if (TOTALS.has(heading) || !/@?\d/.test(heading)) continue;
    if (!text(deceased.getCell(col))) continue;
    columns.push(col);
  }
  return columns;
}

function registerSheet(book: ExcelJS.Workbook): ExcelJS.Worksheet | undefined {
  return (
    book.getWorksheet("Detailed Data") ??
    book.worksheets.find((sheet) => SHEET_NAME.test(sheet.name) && text(sheet.getRow(1).getCell(2)).toUpperCase() === "DECEASED")
  );
}

function summarySheet(book: ExcelJS.Workbook): ExcelJS.Worksheet | undefined {
  return book.getWorksheet("Summary");
}

export function isKwanWorkbook(book: ExcelJS.Workbook): boolean {
  const sheet = registerSheet(book);
  if (!sheet) return false;
  const header = sheet.getRow(4);
  return text(header.getCell(1)).toUpperCase() === "M/NO" && text(header.getCell(2)).toUpperCase() === "NAME";
}

function readMembers(book: ExcelJS.Workbook, phoneFor: (memberNo: string) => string): ParsedMember[] {
  const sheet = summarySheet(book) ?? registerSheet(book);
  if (!sheet) return [];
  const members = new Map<string, ParsedMember>();
  for (let row = 5; row <= sheet.rowCount; row += 1) {
    const memberNo = text(sheet.getRow(row).getCell(1));
    const name = text(sheet.getRow(row).getCell(2));
    if (!/^\d+$/.test(memberNo) || !name || TOTALS.has(name.toUpperCase())) continue;
    const key = memberNo;
    if (!members.has(key)) {
      members.set(key, {
        memberNo,
        name: normalName(name),
        phone: phoneFor(memberNo),
        role: "MEMBER",
        joinDate: "2020-06-01",
        status: "ACTIVE",
        sheet: sheet.name,
        row,
      });
    }
  }
  return [...members.values()];
}

function readContributions(book: ExcelJS.Workbook): ParsedContribution[] {
  const sheet = registerSheet(book);
  if (!sheet) return [];
  const columns = eventColumns(sheet);
  const yearCounts = new Map<string, number>();
  const totals = new Map<string, ParsedContribution>();
  const problems: string[] = [];

  for (const col of columns) {
    const parsed = periodFrom(raw(sheet.getRow(3).getCell(col)));
    let period = parsed.period;
    if (!period && parsed.year) {
      const next = (yearCounts.get(parsed.year) ?? 0) + 1;
      yearCounts.set(parsed.year, next);
      period = `${parsed.year}-${String(next).padStart(2, "0")}`;
    }
    if (!period) {
      problems.push(`${sheet.name} column ${col}: the event date could not be read, so it was left out.`);
      continue;
    }
    for (let row = 5; row <= sheet.rowCount; row += 1) {
      const memberNo = text(sheet.getRow(row).getCell(1));
      const name = text(sheet.getRow(row).getCell(2));
      const paid = amount(sheet.getRow(row).getCell(col));
      if (!paid || paid <= 0 || !name || TOTALS.has(name.toUpperCase())) continue;
      const key = `${memberNo || normalName(name)}:${period}`;
      const existing = totals.get(key);
      if (existing) {
        existing.amountCents += Math.round(paid * 100);
        continue;
      }
      totals.set(key, {
        memberNo: memberNo || null,
        name: normalName(name),
        phone: null,
        period,
        amountCents: Math.round(paid * 100),
        sheet: sheet.name,
        row: col,
      });
    }
  }

  return [...totals.values()];
}

/**
 * Read a KWAN funeral register without changing anything on disk. Callers may
 * supply phone numbers for onboarding; later uploads leave them blank and the
 * existing register matching places each payment by member number.
 */
export function parseKwanWorkbook(
  book: ExcelJS.Workbook,
  options: { phoneFor?: (memberNo: string) => string } = {},
): WorkbookRead {
  return {
    members: readMembers(book, options.phoneFor ?? (() => "")),
    contributions: readContributions(book),
    problems: [],
  };
}

/** Deterministic, non-real numbers used until the chama supplies its own list. */
export function placeholderPhone(memberNo: string): string {
  const digits = memberNo.replace(/\D/g, "") || "0";
  return `+25479${digits.padStart(7, "0").slice(-7)}`;
}
