import path from "node:path";
import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";

const file = path.resolve(import.meta.dirname, "../docs/pamoja-iq-upload-template.xlsx");

describe("official upload template", () => {
  it("uses the sheets and headings the treasurer is given", async () => {
    const book = new ExcelJS.Workbook();
    await book.xlsx.readFile(file);
    expect(book.worksheets.map((sheet) => sheet.name)).toEqual([
      "How to use",
      "Members",
      "Contributions",
      "Loans",
      "Fines",
    ]);

    const members = book.getWorksheet("Members");
    expect(members?.getRow(1).values).toEqual([
      undefined,
      "Member No",
      "Full Name",
      "Phone",
      "Role",
      "Join Date",
      "Status",
    ]);
    expect(members?.getRow(2).getCell(2).text).toBe("Grace Wanjiru");
    expect(members?.getRow(2).getCell(3).text).toBe("0712345001");
    expect(members?.getRow(5).getCell(2).text).toBe("");

    const contributions = book.getWorksheet("Contributions");
    expect(contributions?.getRow(1).getCell(3).text).toBe("2026-01");
    expect(contributions?.getRow(1).getCell(14).text).toBe("2026-12");
    expect(contributions?.getRow(1).getCell(15).text).toBe("Total (KES)");
    expect(contributions?.getRow(2).getCell(12).value).toBe(2000);
    expect(contributions?.getRow(4).getCell(11).value).toBe(2000);
    expect(contributions?.getRow(4).getCell(12).value ?? null).toBeNull();

    const loans = book.getWorksheet("Loans");
    expect(loans?.getRow(1).getCell(9).text).toBe("Total Due (KES)");
    expect(loans?.getRow(1).getCell(10).text).toBe("Balance (KES)");
    expect(loans?.getRow(2).getCell(9).value).toMatchObject({
      formula: 'IF(C2="","",C2*(1+D2*E2))',
    });

    const fines = book.getWorksheet("Fines");
    expect(fines?.getRow(1).values).toEqual([
      undefined,
      "Member No",
      "Date",
      "Type",
      "Amount (KES)",
      "Paid (Yes/No)",
    ]);
    expect(fines?.getRow(2).getCell(3).text).toBe("Late contribution");
  });
});
