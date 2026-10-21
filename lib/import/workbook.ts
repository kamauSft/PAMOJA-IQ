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

export type Column =
  | { kind: "name" | "phone" | "memberNo" | "role" | "join" | "status" | "amount" | "date" | "skip" }
  | { kind: "month"; period: string };

export interface SheetHeading {
  rowNumber: number;
  columns: Column[];
  titleText: string;
}

export interface UnclearSheet {
  sheetName: string;
  rowNumber: number;
  titleText: string;
  header: string[];
  samples: string[][];
}

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
  januari: "01",
  februari: "02",
  machi: "03",
  aprili: "04",
  mei: "05",
  juni: "06",
  julai: "07",
  agosti: "08",
  septemba: "09",
  oktoba: "10",
  novemba: "11",
  desemba: "12",
};

const MONTH_NAMES = Object.keys(MONTHS).sort((left, right) => right.length - left.length);

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
  const iso = text.match(/^(\d{4})-(\d{2})$/);
  if (iso) {
    const month = Number(iso[2]);
    if (month < 1 || month > 12) return null;
    return `${iso[1]}-${iso[2]}`;
  }
  const slash = text.match(/^(\d{1,2})[/-](\d{4})$/);
  if (slash) {
    const month = Number(slash[1]);
    if (month < 1 || month > 12) return null;
    return `${slash[2]}-${String(month).padStart(2, "0")}`;
  }
  const named = text.match(new RegExp(`^(${MONTH_NAMES.join("|")})[\\s/-]+(\\d{4})$`));
  if (named && MONTHS[named[1]]) return `${named[2]}-${MONTHS[named[1]]}`;
  return null;
}

function periodsMentioned(text: string): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase().replace(/\./g, " ");
  for (const match of lower.matchAll(/\b(\d{4})-(\d{2})\b/g)) {
    const period = monthPeriod(`${match[1]}-${match[2]}`);
    if (period) found.add(period);
  }
  for (const match of lower.matchAll(/\b(\d{1,2})[/-](\d{4})\b/g)) {
    const period = monthPeriod(`${match[1]}/${match[2]}`);
    if (period) found.add(period);
  }
  const named = new RegExp(`\\b(${MONTH_NAMES.join("|")})\\b[\\s/-]*(\\d{4})`, "g");
  for (const match of lower.matchAll(named)) {
    const month = MONTHS[match[1]];
    if (month) found.add(`${match[2]}-${month}`);
  }
  return [...found];
}

function periodFromDate(value: string): string | null {
  const text = value.trim().toLowerCase().replace(/\./g, "");
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (iso) return monthPeriod(`${iso[1]}-${iso[2]}`);
  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) return `${dmy[3]}-${String(month).padStart(2, "0")}`;
    return null;
  }
  const named = text.match(new RegExp(`^(\\d{1,2})[\\s/-]+(${MONTH_NAMES.join("|")})\\b[\\s,/-]+(\\d{4})$`));
  if (named && MONTHS[named[2]]) return `${named[3]}-${MONTHS[named[2]]}`;
  if (/^\d{5}(?:\.\d+)?$/.test(text)) {
    const serial = Math.floor(Number(text));
    if (serial > 20000 && serial < 80000) {
      const utc = new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000);
      return monthPeriod(utc.toISOString().slice(0, 7));
    }
  }
  return null;
}

function classifyHeader(header: string): Column {
  const text = header.trim().toLowerCase().replace(/\s+/g, " ");
  if (!text) return { kind: "skip" };
  const period = monthPeriod(text);
  if (period) return { kind: "month", period };
  if (["jumla", "total", "totals", "sum"].includes(text) || text.startsWith("jumla ") || text.startsWith("total ")) {
    return { kind: "skip" };
  }
  if (
    text.includes("simu") ||
    text.includes("phone") ||
    text.includes("mobile") ||
    /\btel\b/.test(text) ||
    text.includes("whatsapp") ||
    text.includes("msisdn")
  ) {
    return { kind: "phone" };
  }
  if (text.includes("nambari") || text.includes("member no") || text.includes("member number") || text === "no" || text === "no.") {
    return { kind: "memberNo" };
  }
  if (text.includes("repaid") || text.includes("mkopo") || text.includes("loan") || text.includes("fine") || text.includes("faini")) {
    return { kind: "skip" };
  }
  if (
    text === "amount" ||
    text === "paid" ||
    text === "cash" ||
    text.includes("kiasi") ||
    text.includes("malipo") ||
    text.includes("mchango") ||
    text.includes("ilipwa") ||
    text.includes("imelipwa") ||
    text.includes("shilling") ||
    text === "kes" ||
    text === "ksh"
  ) {
    return { kind: "amount" };
  }
  if (text.includes("join") || text.includes("kujiunga") || text === "tarehe") return { kind: "join" };
  if (text.includes("date") || text.includes("tarehe") || text === "siku" || text.includes("paid on")) return { kind: "date" };
  if (text === "role" || text === "cheo") return { kind: "role" };
  if (text === "status" || text === "hali") return { kind: "status" };
  if (
    text.includes("jina") ||
    text === "name" ||
    text.includes("full name") ||
    text.includes("member name") ||
    text.includes("mwanachama") ||
    text.includes("aliyelipa") ||
    text === "member" ||
    text.includes("contributor") ||
    text.includes("paid by")
  ) {
    return { kind: "name" };
  }
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

function sheetKeepsPayments(name: string): boolean {
  return !/(loan|mkopo|fine|faini|expense|repay|matumizi)/i.test(name);
}

export function confirmedPeriod(header: string, titleText: string): string | null {
  const direct = monthPeriod(header);
  if (direct) return direct;
  const mentioned = periodsMentioned(header);
  if (mentioned.length === 1) return mentioned[0];
  const month = MONTHS[header.trim().toLowerCase().replace(/\./g, "")];
  if (!month) return null;
  const years = titleText.match(/\b(20\d{2})\b/g) ?? [];
  if (new Set(years).size !== 1) return null;
  return `${years[0]}-${month}`;
}

export function textPeriod(text: string, titleText: string): string | null {
  const mentioned = periodsMentioned(text);
  if (mentioned.length === 1) return mentioned[0];
  if (mentioned.length > 1) return null;
  const lower = text.toLowerCase();
  const hits = MONTH_NAMES.filter((name) => new RegExp(`\\b${name}\\b`).test(lower));
  if (hits.length !== 1) return null;
  return confirmedPeriod(hits[0], `${text} ${titleText}`);
}

export interface NoteSheet {
  sheetName: string;
  titleText: string;
  lines: { rowNumber: number; text: string }[];
  truncated: boolean;
}

export function noteSheets(book: ExcelJS.Workbook): NoteSheet[] {
  const tables = new Set(unclearSheets(book).map((sheet) => sheet.sheetName));
  const found: NoteSheet[] = [];
  for (const sheet of book.worksheets) {
    if (!sheetKeepsPayments(sheet.name) || findHeader(sheet) || tables.has(sheet.name)) continue;
    const rows: { rowNumber: number; text: string }[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 20 || rows.length > 12) return;
      const text = rowValues(row).filter(Boolean).join(" ").replace(/\s+/g, " ").trim().slice(0, 160);
      if (text) rows.push({ rowNumber, text });
    });
    const notes = rows.filter((row) => /[a-z]/i.test(row.text) && /\d/.test(row.text) && !isOnlyPeriod(row.text) && !isTotalRow(row.text, ""));
    if (notes.length === 0) continue;
    const first = notes[0].rowNumber;
    found.push({
      sheetName: sheet.name,
      titleText: rows
        .filter((row) => row.rowNumber < first)
        .map((row) => row.text)
        .join(" ")
        .slice(0, 160),
      lines: notes.slice(0, 8),
      truncated: notes.length > 8,
    });
  }
  return found;
}

function isOnlyPeriod(text: string): boolean {
  if (!textPeriod(text, text)) return false;
  if (/(?<!\d)\d[\d\s().-]{6,}\d(?!\d)/.test(text)) return false;
  const rest = text
    .toLowerCase()
    .replace(/\b20\d{2}\b/g, " ")
    .replace(new RegExp(`\\b(${MONTH_NAMES.join("|")})\\b`, "g"), " ")
    .replace(/[^a-z]+/g, " ")
    .trim();
  return rest.length < 2;
}

function findHeader(sheet: ExcelJS.Worksheet): SheetHeading | null {
  const earlier: string[] = [];
  let found: { rowNumber: number; columns: Column[]; titleText: string } | null = null;
  sheet.eachRow((row, rowNumber) => {
    if (found || rowNumber > 20) return;
    const values = rowValues(row);
    const columns = values.map((cell) => classifyHeader(cell));
    const hasName = columns.some((column) => column.kind === "name" || column.kind === "phone");
    const hasPerson = hasName || columns.some((column) => column.kind === "memberNo");
    const hasMoney = columns.some((column) => column.kind === "month" || column.kind === "amount");
    if (hasName || (hasPerson && hasMoney)) found = { rowNumber, columns, titleText: earlier.join(" ") };
    else earlier.push(values.join(" "));
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

export function unclearSheets(book: ExcelJS.Workbook): UnclearSheet[] {
  const found: UnclearSheet[] = [];
  for (const sheet of book.worksheets) {
    if (!sheetKeepsPayments(sheet.name) || findHeader(sheet)) continue;
    const rows: { rowNumber: number; values: string[] }[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 20 || rows.length > 8) return;
      const values = rowValues(row)
        .slice(0, 12)
        .map((cell) => cell.slice(0, 80));
      if (values.some(Boolean)) rows.push({ rowNumber, values });
    });
    if (rows.length < 2) continue;
    let best = 0;
    let bestScore = -1;
    rows.forEach((row, index) => {
      const score = row.values.filter((cell) => cell && shillingsToCents(cell) == null && !/^\d+$/.test(cell)).length;
      if (score > bestScore) {
        bestScore = score;
        best = index;
      }
    });
    if (bestScore < 2) continue;
    found.push({
      sheetName: sheet.name,
      rowNumber: rows[best].rowNumber,
      titleText: rows
        .slice(0, best)
        .map((row) => row.values.join(" "))
        .join(" "),
      header: rows[best].values,
      samples: rows.slice(best + 1, best + 6).map((row) => row.values),
    });
  }
  return found;
}

function parseSheet(sheet: ExcelJS.Worksheet, result: WorkbookRead, assisted?: SheetHeading) {
  if (!sheetKeepsPayments(sheet.name)) return;
  const header = findHeader(sheet) ?? assisted ?? null;
  if (!header) return;
  const titlePeriods = periodsMentioned(`${sheet.name} ${header.titleText}`);
  const titlePeriod = titlePeriods.length === 1 ? titlePeriods[0] : null;
  const hasMonth = header.columns.some((column) => column.kind === "month");
  const amountIndex = header.columns.findIndex((column) => column.kind === "amount");
  const dateIndex = header.columns.findIndex((column) => column.kind === "date");
  if (!hasMonth && amountIndex >= 0 && titlePeriods.length > 1) {
    note(result.problems, `${sheet.name}: more than one month is named above the table, so those amounts were left out.`);
  }

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
    if (phone || memberNo) {
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

    const addPayment = (period: string, amountCents: number) => {
      if (!phone && !memberNo && !name) {
        note(result.problems, `${sheet.name} row ${rowNumber}: a payment has no member number, phone, or name.`);
        return;
      }
      result.contributions.push({
        memberNo,
        name,
        phone,
        period,
        amountCents,
        sheet: sheet.name,
        row: rowNumber,
      });
    };

    if (hasMonth) {
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
        addPayment(column.period, amountCents);
      });
      return;
    }

    if (amountIndex < 0 || titlePeriods.length > 1) return;
    const raw = cells[amountIndex] ?? "";
    if (!raw) return;
    const amountCents = shillingsToCents(raw);
    if (amountCents == null) {
      note(result.problems, `${sheet.name} row ${rowNumber}: could not read the amount "${raw}".`);
      return;
    }
    if (amountCents <= 0) return;
    const dated = dateIndex >= 0 ? periodFromDate(cells[dateIndex] ?? "") : null;
    const period = dated ?? titlePeriod;
    if (!period) {
      note(result.problems, `${sheet.name} row ${rowNumber}: the amount has no month.`);
      return;
    }
    addPayment(period, amountCents);
  });
}

export function parseWorkbook(book: ExcelJS.Workbook, assists?: Map<string, SheetHeading>): WorkbookRead {
  const result: WorkbookRead = { members: [], contributions: [], problems: [] };
  for (const sheet of book.worksheets) {
    if (!sheetKeepsPayments(sheet.name)) continue;
    parseSheet(sheet, result, assists?.get(sheet.name));
  }
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
  const { askColumnMap, askNoteLines, aiImportEnabled } = await import("@/lib/import/column-assist");
  const needed = unclearSheets(book);
  const notes = noteSheets(book);
  const assists = new Map<string, SheetHeading>();
  if (aiImportEnabled()) {
    for (const sheet of needed) {
      const columns = await askColumnMap(sheet);
      if (!columns) continue;
      assists.set(sheet.sheetName, { rowNumber: sheet.rowNumber, columns, titleText: sheet.titleText });
    }
  }
  const result = parseWorkbook(book, assists);
  if (aiImportEnabled()) {
    for (const sheet of unclearSheets(book)) {
      if (assists.has(sheet.sheetName)) continue;
      note(result.problems, `${sheet.sheetName}: the helper could not name the columns, so that sheet was left out.`);
    }
    for (const sheet of notes) {
      if (sheet.truncated) note(result.problems, `${sheet.sheetName}: only the first 8 lines were read.`);
      const read = await askNoteLines(sheet);
      if (!read) {
        note(result.problems, `${sheet.sheetName}: the helper could not read those lines, so they were left out.`);
        continue;
      }
      result.members.push(...read.members);
      result.contributions.push(...read.contributions);
      for (const problem of read.problems) note(result.problems, problem);
    }
  }
  return result;
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
