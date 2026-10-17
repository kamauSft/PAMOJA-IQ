import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import type { MembershipRole } from "@prisma/client";
import { normalizePhone } from "@/lib/phone";

export interface ParsedMember {
  memberNo: string | null;
  name: string;
  phone: string;
  role: MembershipRole;
  joinDate: string | null;
  status: "ACTIVE" | "EXITED";
  sheet: string;
  row: number;
}

export interface ParsedContribution {
  memberNo: string | null;
  name: string;
  phone: string | null;
  period: string;
  amountCents: number;
  sheet: string;
  row: number;
}

export interface WorkbookRead {
  members: ParsedMember[];
  contributions: ParsedContribution[];
  problems: string[];
}

type Column =
  | { kind: "name" | "phone" | "memberNo" | "role" | "join" | "status" | "skip" }
  | { kind: "month"; period: string };

const MONTHS: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value).trim();
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && "text" in value && typeof value.text === "string") return value.text.trim();
  if (typeof value === "object" && "result" in value) return cellText(value.result as ExcelJS.CellValue);
  if (typeof value === "object" && "richText" in value && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text).join("").trim();
  }
  return "";
}

function rowValues(row: ExcelJS.Row): string[] {
  const raw = row.values;
  const list = Array.isArray(raw) ? raw.slice(1) : [];
  return list.map((value) => cellText(value as ExcelJS.CellValue));
}

export function shillingsToCents(value: string): number | null {
  const text = value.trim().toLowerCase().replace(/ksh|kes|\/|=|\s/g, "").replace(/,/g, "");
  if (!text) return null;
  const thousands = text.match(/^(\d+(?:\.\d+)?)k$/);
  if (thousands) return Math.round(Number(thousands[1]) * 1000 * 100);
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  return Math.round(Number(text) * 100);
}

function monthPeriod(header: string): string | null {
  const text = header.trim().toLowerCase().replace(/\./g, "");
  if (/^\d{4}-\d{2}$/.test(text)) return text;
  const slash = text.match(/^(\d{1,2})[/-](\d{4})$/);
  if (slash) {
    const month = slash[1].padStart(2, "0");
    if (Number(month) < 1 || Number(month) > 12) return null;
    return `${slash[2]}-${month}`;
  }
  const named = text.match(
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)[\s/-]+(\d{4})$/,
  );
  if (named && MONTHS[named[1]]) return `${named[2]}-${MONTHS[named[1]]}`;
  return null;
}

function classifyHeader(header: string): Column {
  const text = header.trim().toLowerCase().replace(/\s+/g, " ");
  if (!text) return { kind: "skip" };
  const period = monthPeriod(text);
  if (period) return { kind: "month", period };
  if (["jumla", "total", "totals", "sum"].includes(text)) return { kind: "skip" };
  if (text.includes("simu") || text.includes("phone") || text.includes("mobile") || /\btel\b/.test(text)) {
    return { kind: "phone" };
  }
  if (text.includes("jina") || text === "name" || text.includes("full name") || text.includes("member name")) {
    return { kind: "name" };
  }
  if (text.includes("nambari") || text.includes("member no") || text.includes("member number") || text === "no") {
    return { kind: "memberNo" };
  }
  if (text === "role" || text === "cheo") return { kind: "role" };
  if (text.includes("join") || text === "tarehe") return { kind: "join" };
  if (text === "status" || text === "hali") return { kind: "status" };
  return { kind: "skip" };
}

function roleOf(text: string): MembershipRole {
  const value = text.toLowerCase();
  if (value.includes("treas") || value.includes("hazina")) return "TREASURER";
  if (value.includes("chair") || value.includes("mwenyekiti")) return "CHAIR";
  if (value.includes("secret") || value.includes("katibu")) return "SECRETARY";
  if (value.includes("audit") || value.includes("mkaguzi")) return "AUDITOR";
  return "MEMBER";
}

function isTotalRow(name: string, memberNo: string): boolean {
  const label = `${name} ${memberNo}`.trim().toLowerCase();
  if (!label) return false;
  return /\b(jumla|total|totals|sum)\b/.test(label);
}

function note(problems: string[], message: string) {
  if (problems.length < 50) problems.push(message);
}

function findHeader(sheet: ExcelJS.Worksheet): { rowNumber: number; columns: Column[] } | null {
  let found: { rowNumber: number; columns: Column[] } | null = null;
  sheet.eachRow((row, rowNumber) => {
    if (found || rowNumber > 20) return;
    const columns = rowValues(row).map((cell) => classifyHeader(cell));
    const useful = columns.some((column) => column.kind === "name" || column.kind === "phone");
    if (useful) found = { rowNumber, columns };
  });
  return found;
}

function upsertMember(members: ParsedMember[], problems: string[], draft: ParsedMember) {
  const clash = members.find(
    (member) =>
      draft.memberNo &&
      member.memberNo === draft.memberNo &&
      draft.phone &&
      member.phone &&
      member.phone !== draft.phone,
  );
  if (clash) {
    note(problems, `${draft.sheet} row ${draft.row}: member number ${draft.memberNo} is already used by ${clash.name}.`);
    return;
  }
  const match = members.find((member) => {
    if (draft.phone && member.phone === draft.phone) return true;
    if (draft.memberNo && member.memberNo === draft.memberNo) return true;
    return false;
  });
  if (!match) {
    members.push(draft);
    return;
  }
  if (!match.phone && draft.phone) match.phone = draft.phone;
  if (!match.memberNo && draft.memberNo) match.memberNo = draft.memberNo;
  if (!match.name && draft.name) match.name = draft.name;
}

function parseSheet(sheet: ExcelJS.Worksheet, result: WorkbookRead) {
  const header = findHeader(sheet);
  if (!header) return;
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= header.rowNumber) return;
    const cells = rowValues(row);
    const pick = (kind: Column["kind"]) => {
      const index = header.columns.findIndex((column) => column.kind === kind);
      return index >= 0 ? (cells[index] ?? "") : "";
    };
    const name = pick("name");
    const memberNo = pick("memberNo").replace(/\s+/g, "") || null;
    const phoneText = pick("phone");
    if (!name && !phoneText && !memberNo && cells.every((cell) => !cell)) return;
    if (isTotalRow(name, memberNo ?? "")) return;

    const phone = phoneText ? normalizePhone(phoneText) : null;
    if (phoneText && !phone) {
      note(result.problems, `${sheet.name} row ${rowNumber}: ${phoneText} is not a Kenyan mobile number.`);
    }
    if (name || phone) {
      upsertMember(result.members, result.problems, {
        memberNo,
        name: name || "Member",
        phone: phone ?? "",
        role: roleOf(pick("role")),
        joinDate: /^\d{4}-\d{2}-\d{2}$/.test(pick("join")) ? pick("join") : null,
        status: /exit|left|inactive|gone/i.test(pick("status")) ? "EXITED" : "ACTIVE",
        sheet: sheet.name,
        row: rowNumber,
      });
    }

    header.columns.forEach((column, index) => {
      if (column.kind !== "month") return;
      const raw = cells[index] ?? "";
      if (!raw) return;
      const amountCents = shillingsToCents(raw);
      if (amountCents == null) {
        note(result.problems, `${sheet.name} row ${rowNumber}: could not read the amount "${raw}".`);
        return;
      }
      if (amountCents <= 0) return;
      if (!phone && !memberNo) {
        note(result.problems, `${sheet.name} row ${rowNumber}: a payment has no member number or phone.`);
        return;
      }
      result.contributions.push({
        memberNo,
        name,
        phone,
        period: column.period,
        amountCents,
        sheet: sheet.name,
        row: rowNumber,
      });
    });
  });
}

export function parseWorkbook(book: ExcelJS.Workbook): WorkbookRead {
  const result: WorkbookRead = { members: [], contributions: [], problems: [] };
  for (const sheet of book.worksheets) parseSheet(sheet, result);
  for (const payment of result.contributions) {
    if (payment.phone) continue;
    const known = result.members.find((member) => payment.memberNo && member.memberNo === payment.memberNo && member.phone);
    if (known) payment.phone = known.phone;
  }
  return result;
}

export async function readUpload(buffer: Buffer, filename: string): Promise<WorkbookRead> {
  const book = new ExcelJS.Workbook();
  if (filename.toLowerCase().endsWith(".csv")) {
    await book.csv.read(Readable.from(buffer));
  } else {
    await book.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  }
  return parseWorkbook(book);
}

export function recentPeriods(count = 3, today = new Date()): string[] {
  const periods: string[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - index, 1));
    periods.push(date.toISOString().slice(0, 7));
  }
  return periods;
}

export async function templateWorkbook(): Promise<Buffer> {
  const book = new ExcelJS.Workbook();
  const members = book.addWorksheet("Members");
  members.addRow(["Member No", "Full Name", "Phone", "Role", "Join Date", "Status"]);
  const contributions = book.addWorksheet("Contributions");
  contributions.addRow(["Member No", "Full Name", "Phone", ...recentPeriods()]);
  const bytes = await book.xlsx.writeBuffer();
  return Buffer.from(bytes);
}
