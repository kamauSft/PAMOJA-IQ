import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

const root = path.resolve(import.meta.dirname, "..");
const EMPTY_ROWS = 200;
const NAVY = "FF0F2A3D";
const YELLOW = "FFFFF2CC";
const GREY = "FFE7E6E6";
const BLUE = "FF0000FF";
const WHITE = "FFFFFFFF";
const BLACK = "FF000000";

type FillKind = "input" | "calculated";

function paint(cell: ExcelJS.Cell, kind: FillKind, numFmt?: string) {
  cell.font = {
    name: "Arial",
    size: 10,
    color: { argb: kind === "input" ? BLUE : BLACK },
  };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: kind === "input" ? YELLOW : GREY },
  };
  if (numFmt) cell.numFmt = numFmt;
}

function header(cell: ExcelJS.Cell, label: string) {
  cell.value = label;
  cell.font = { name: "Arial", size: 10, bold: true, color: { argb: WHITE } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  cell.alignment = { vertical: "middle", wrapText: true };
}

function choices(cell: ExcelJS.Cell, options: string) {
  cell.dataValidation = {
    type: "list",
    allowBlank: true,
    formulae: [`"${options}"`],
  };
}

function dateValue(day: number, month: number, year: number) {
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function prepare(sheet: ExcelJS.Worksheet, titles: string[], widths: number[]) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  titles.forEach((title, index) => {
    header(sheet.getRow(1).getCell(index + 1), title);
    sheet.getColumn(index + 1).width = widths[index];
  });
  sheet.getRow(1).height = 22;
}

function howToUse(book: ExcelJS.Workbook) {
  const sheet = book.addWorksheet("How to use");
  sheet.getColumn(2).width = 88;
  const lines = [
    "PAMOJA IQ: TREASURER UPLOAD TEMPLATE",
    "Keep the sheet names and column headings exactly. Do not add or rename columns.",
    "The first rows are EXAMPLES. Type over them or delete them before uploading.",
    "Yellow cells are where you type. Grey cells are calculated. Do not type in grey cells.",
    "Member No links everything. Use the same Member No on every sheet.",
    "Write the phone like 0712345678. Members sign in with it, so it must be correct and unique.",
    "Amounts are numbers only, in Kenyan shillings. Leave a month blank if it is unpaid.",
    "Dates are day/month/year.",
    "Upload again each month. Pamoja IQ adds only what is new and shows a preview first.",
    "Nothing is visible to members until the treasurer clicks Publish to members.",
  ];
  lines.forEach((line, index) => {
    const cell = sheet.getCell(index + 1, 2);
    cell.value = line;
    cell.font = { name: "Arial", size: index === 0 ? 14 : 10, bold: index === 0 };
    cell.alignment = { wrapText: true, vertical: "top" };
    sheet.getRow(index + 1).height = index === 0 ? 24 : 32;
  });
}

function members(book: ExcelJS.Workbook) {
  const sheet = book.addWorksheet("Members");
  const titles = ["Member No", "Full Name", "Phone", "Role", "Join Date", "Status"];
  prepare(sheet, titles, [14, 28, 16, 16, 16, 14]);
  const examples: Array<[string, string, string, string, Date, string]> = [
    ["M001", "Grace Wanjiru", "0712345001", "Chair", dateValue(1, 5, 2025), "Active"],
    ["M002", "Peter Otieno", "0712345002", "Treasurer", dateValue(1, 5, 2025), "Active"],
    ["M003", "Amina Hassan", "0712345005", "Member", dateValue(1, 5, 2025), "Active"],
  ];
  for (let offset = 0; offset < examples.length + EMPTY_ROWS; offset += 1) {
    const row = sheet.getRow(offset + 2);
    const example = examples[offset];
    for (let column = 1; column <= 6; column += 1) {
      const cell = row.getCell(column);
      const format = column === 3 ? "@" : column === 5 ? "DD/MM/YYYY" : undefined;
      paint(cell, "input", format);
      if (example) cell.value = example[column - 1];
    }
    choices(row.getCell(4), "Member,Chair,Treasurer,Secretary");
    choices(row.getCell(6), "Active,Exited,Suspended");
  }
}

function contributions(book: ExcelJS.Workbook) {
  const months = Array.from({ length: 12 }, (_, index) => `2026-${String(index + 1).padStart(2, "0")}`);
  const titles = ["Member No", "Full Name", ...months, "Total (KES)"];
  const sheet = book.addWorksheet("Contributions");
  prepare(sheet, titles, [14, 28, ...months.map(() => 12), 14]);
  const paidThrough = [10, 10, 9];
  const names = [
    ["M001", "Grace Wanjiru"],
    ["M002", "Peter Otieno"],
    ["M003", "Amina Hassan"],
  ] as const;
  for (let offset = 0; offset < names.length + EMPTY_ROWS; offset += 1) {
    const rowNumber = offset + 2;
    const row = sheet.getRow(rowNumber);
    const example = names[offset];
    paint(row.getCell(1), "input");
    paint(row.getCell(2), "input");
    if (example) {
      row.getCell(1).value = example[0];
      row.getCell(2).value = example[1];
    }
    for (let month = 0; month < 12; month += 1) {
      const cell = row.getCell(month + 3);
      paint(cell, "input", "#,##0");
      if (example && month < paidThrough[offset]) cell.value = 2000;
    }
    const total = row.getCell(15);
    total.value = { formula: `IF(COUNTA(A${rowNumber})=0,"",SUM(C${rowNumber}:N${rowNumber}))` };
    paint(total, "calculated", "#,##0");
  }
}

function loans(book: ExcelJS.Workbook) {
  const titles = [
    "Member No",
    "Loan Date",
    "Amount Borrowed (KES)",
    "Interest Rate (% per month)",
    "Months",
    "Purpose",
    "Amount Repaid (KES)",
    "Status",
    "Total Due (KES)",
    "Balance (KES)",
  ];
  const sheet = book.addWorksheet("Loans");
  prepare(sheet, titles, [14, 16, 24, 28, 12, 22, 22, 14, 18, 16]);
  const examples = [
    ["M003", dateValue(10, 7, 2026), 10000, 0.1, 5, "School fees", 8400, "Active"],
    ["M001", dateValue(3, 2, 2026), 15000, 0.1, 3, "Stock for shop", 19500, "Paid"],
  ] as const;
  for (let offset = 0; offset < examples.length + EMPTY_ROWS; offset += 1) {
    const rowNumber = offset + 2;
    const row = sheet.getRow(rowNumber);
    const example = examples[offset];
    for (let column = 1; column <= 8; column += 1) {
      const format = column === 2 ? "DD/MM/YYYY" : column === 3 || column === 7 ? "#,##0" : column === 4 ? "0%" : undefined;
      paint(row.getCell(column), "input", format);
      if (example) row.getCell(column).value = example[column - 1];
    }
    choices(row.getCell(8), "Active,Paid,Defaulted");
    const due = row.getCell(9);
    due.value = { formula: `IF(C${rowNumber}="","",C${rowNumber}*(1+D${rowNumber}*E${rowNumber}))` };
    paint(due, "calculated", "#,##0");
    const balance = row.getCell(10);
    balance.value = { formula: `IF(C${rowNumber}="","",I${rowNumber}-G${rowNumber})` };
    paint(balance, "calculated", "#,##0");
  }
}

function fines(book: ExcelJS.Workbook) {
  const sheet = book.addWorksheet("Fines");
  prepare(sheet, ["Member No", "Date", "Type", "Amount (KES)", "Paid (Yes/No)"], [14, 16, 24, 16, 16]);
  for (let offset = 0; offset < 1 + EMPTY_ROWS; offset += 1) {
    const row = sheet.getRow(offset + 2);
    for (let column = 1; column <= 5; column += 1) {
      const format = column === 2 ? "DD/MM/YYYY" : column === 4 ? "#,##0" : undefined;
      paint(row.getCell(column), "input", format);
    }
    choices(row.getCell(3), "Late contribution,Missed meeting,Late loan payment,Other");
    choices(row.getCell(5), "Yes,No");
    if (offset === 0) {
      row.getCell(1).value = "M003";
      row.getCell(2).value = dateValue(6, 10, 2026);
      row.getCell(3).value = "Late contribution";
      row.getCell(4).value = 200;
      row.getCell(5).value = "No";
    }
  }
}

async function main() {
  const book = new ExcelJS.Workbook();
  book.creator = "Pamoja IQ";
  howToUse(book);
  members(book);
  contributions(book);
  loans(book);
  fines(book);
  const docsFile = path.join(root, "docs", "pamoja-iq-upload-template.xlsx");
  const publicDir = path.join(root, "public", "templates");
  await mkdir(publicDir, { recursive: true });
  await book.xlsx.writeFile(docsFile);
  await copyFile(docsFile, path.join(publicDir, "pamoja-iq-upload-template.xlsx"));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
