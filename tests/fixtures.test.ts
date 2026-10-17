import path from "node:path";
import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";

const fixtures = path.resolve(import.meta.dirname, "../fixtures");

describe("sample workbooks", () => {
  it("includes the template sheets a treasurer downloads", async () => {
    const book = new ExcelJS.Workbook();
    await book.xlsx.readFile(path.join(fixtures, "pamoja-template-filled.xlsx"));
    expect(book.worksheets.map((sheet) => sheet.name)).toEqual([
      "Members",
      "Contributions",
      "Loans",
      "Repayments",
      "Fines",
      "Expenses",
    ]);
    expect(book.getWorksheet("Members")?.getRow(2).getCell(3).text).toBe("0712345005");
  });

  it("keeps a messy treasurer sheet with a title row and a totals row", async () => {
    const book = new ExcelJS.Workbook();
    await book.xlsx.readFile(path.join(fixtures, "treasurer-messy.xlsx"));
    const sheet = book.getWorksheet("Michango");
    expect(sheet?.getCell("A1").text).toContain("UMOJA");
    expect(sheet?.getRow(3).getCell(3).text).toBe("Simu");
    expect(sheet?.getRow(6).getCell(2).text).toBe("JUMLA");
  });
});
