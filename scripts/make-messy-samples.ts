import { mkdir } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

const out = path.resolve("public/samples");

async function first() {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Oct cash ");
  sheet.addRow(["Umoja meeting register — October"]);
  sheet.addRow([]);
  sheet.addRow(["Name", "Mobile No.", "Oct 2026", "note"]);
  sheet.addRow(["Amina Hassan", "0712 345 005", "Ksh 1,500", "paid cash"]);
  sheet.addRow(["Peter Otieno", "+254712345002", "2,200/=", ""]);
  sheet.addRow(["Grace Wanjiku", "0712345001", "1.8k", "late"]);
  sheet.addRow([]);
  sheet.addRow(["JUMLA", "", "5,500", ""]);
  await book.xlsx.writeFile(path.join(out, "messy-register-1.xlsx"));
}

async function second() {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Sheet1");
  sheet.addRow(["Full Name", "Tel", "10/2026"]);
  sheet.addRow(["Amina Hassan Bakari", "254712345005", "KES 4,500"]);
  sheet.addRow(["Peter  Otieno", "0712345002", "900"]);
  sheet.addRow(["Grace Wanjiku Mwangi", "0712-345-001", "3,100"]);
  sheet.addRow(["Total", "", "8500"]);
  await book.xlsx.writeFile(path.join(out, "messy-register-2.xlsx"));
}

async function main() {
  await mkdir(out, { recursive: true });
  await first();
  await second();
  console.log("Wrote public/samples/messy-register-1.xlsx and messy-register-2.xlsx");
}

main();
