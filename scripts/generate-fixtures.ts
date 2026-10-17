import { mkdir } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

const root = path.resolve(import.meta.dirname, "..");
const fixtures = path.join(root, "fixtures");

async function writeTemplate() {
  const book = new ExcelJS.Workbook();
  const members = book.addWorksheet("Members");
  members.addRow(["Member No", "Full Name", "Phone", "Role", "Join Date", "Status"]);
  members.addRow(["M001", "Amina Hassan", "0712345005", "Member", "2025-05-01", "Active"]);
  members.addRow(["M002", "Peter Otieno", "0712345002", "Treasurer", "2024-01-15", "Active"]);

  const contributions = book.addWorksheet("Contributions");
  contributions.addRow(["Member No", "Full Name", "2025-05", "2025-06", "2026-10"]);
  contributions.addRow(["M001", "Amina Hassan", 2000, 2000, 2000]);
  contributions.addRow(["M002", "Peter Otieno", 2000, 2000, 0]);

  const loans = book.addWorksheet("Loans");
  loans.addRow(["Member No", "Loan Date", "Principal", "Interest Rate %", "Months", "Purpose", "Amount Repaid", "Status"]);
  loans.addRow(["M001", "2026-06-01", 15000, 10, 6, "School fees", 8400, "Active"]);

  const repayments = book.addWorksheet("Repayments");
  repayments.addRow(["Member No", "Date", "Amount", "Loan Date", "Reference"]);
  repayments.addRow(["M001", "2026-07-06", 4200, "2026-06-01", "CASH-001"]);

  const fines = book.addWorksheet("Fines");
  fines.addRow(["Member No", "Date", "Type", "Amount", "Paid (Yes/No)"]);
  fines.addRow(["M002", "2026-08-06", "Late contribution", 200, "Yes"]);

  const expenses = book.addWorksheet("Expenses");
  expenses.addRow(["Date", "Description", "Amount"]);
  expenses.addRow(["2026-09-01", "Exercise books", 1500]);

  await book.xlsx.writeFile(path.join(fixtures, "pamoja-template-filled.xlsx"));
}

async function writeMessy() {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Michango");
  sheet.mergeCells("A1:F1");
  sheet.getCell("A1").value = "UMOJA SAVINGS GROUP — Michango ya wanachama";
  sheet.addRow([]);
  sheet.addRow(["Nambari", "Jina", "Simu", "Jan 2026", "Feb 2026", "Jumla"]);
  sheet.addRow(["M001", "Amina Hassan", "0712 345 005", "2,000", "2000/=", 4000]);
  sheet.addRow(["", "Peter Otieno", "+254712345002", "Ksh 2000", "2k", 4000]);
  sheet.addRow(["", "JUMLA", "", 4000, 4000, 8000]);
  await book.xlsx.writeFile(path.join(fixtures, "treasurer-messy.xlsx"));
}

async function main() {
  await mkdir(fixtures, { recursive: true });
  await writeTemplate();
  await writeMessy();
  console.log("Wrote fixtures/pamoja-template-filled.xlsx and fixtures/treasurer-messy.xlsx");
}

main();
