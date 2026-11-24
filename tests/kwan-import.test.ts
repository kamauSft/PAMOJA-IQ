import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { isKwanWorkbook, parseKwanWorkbook, placeholderPhone } from "@/lib/import/kwan";
import { readUpload } from "@/lib/import/workbook";

function cell(sheet: ExcelJS.Worksheet, row: number, col: number, value: ExcelJS.CellValue) {
  sheet.getRow(row).getCell(col).value = value;
}

async function kwanBook(): Promise<ExcelJS.Workbook> {
  const book = new ExcelJS.Workbook();
  const detail = book.addWorksheet("Detailed Data");
  cell(detail, 1, 2, "DECEASED");
  cell(detail, 3, 2, "DATE");
  cell(detail, 4, 1, "M/NO");
  cell(detail, 4, 2, "NAME");
  cell(detail, 4, 3, "@300/=");
  cell(detail, 4, 4, "TARGET");
  cell(detail, 4, 5, "@1000");
  cell(detail, 4, 6, "TARGET");
  cell(detail, 4, 7, "@300/=");
  cell(detail, 4, 8, "TARGET");
  cell(detail, 4, 9, "ACTUAL");
  cell(detail, 4, 10, "TARGET");

  cell(detail, 1, 3, "FIRST EVENT");
  cell(detail, 3, 3, new Date("2020-06-05T00:00:00.000Z"));
  cell(detail, 1, 5, "SECOND EVENT");
  cell(detail, 3, 5, new Date("2020-06-20T00:00:00.000Z"));
  cell(detail, 1, 7, "YEAR ONLY");
  cell(detail, 3, 7, "2021");
  cell(detail, 1, 9, "TOTALS");
  cell(detail, 3, 9, "TO: AUG 2025");

  for (const [row, no, name] of [
    [5, "1", "CHARLES GUMBO"],
    [6, "2", "ACHIENG OGADA"],
  ] as const) {
    cell(detail, row, 1, no);
    cell(detail, row, 2, name);
    cell(detail, row, 3, 300);
    cell(detail, row, 4, 300);
    cell(detail, row, 5, 1000);
    cell(detail, row, 6, 1000);
    cell(detail, row, 9, 999_999); // totals block must never become a payment
    cell(detail, row, 10, 999_999);
  }

  const summary = book.addWorksheet("Summary");
  cell(summary, 4, 1, "M/NO");
  cell(summary, 4, 2, "NAME");
  cell(summary, 4, 3, "ACTUAL");
  cell(summary, 5, 1, "1");
  cell(summary, 5, 2, "CHARLES GUMBO");
  cell(summary, 6, 1, "2");
  cell(summary, 6, 2, "ACHIENG OGADA");
  cell(summary, 7, 2, "TOTALS");
  return book;
}

describe("KWAN funeral register adapter", () => {
  it("recognises the wide register and leaves ordinary sheets alone", async () => {
    const book = await kwanBook();
    expect(isKwanWorkbook(book)).toBe(true);
    expect(isKwanWorkbook(new ExcelJS.Workbook())).toBe(false);
  });

  it("folds events in one month into one payment and skips the totals block", async () => {
    const read = parseKwanWorkbook(await kwanBook());
    expect(read.members.map((member) => member.memberNo)).toEqual(["1", "2"]);
    expect(read.members.every((member) => member.phone === "")).toBe(true);
    expect(read.contributions).toHaveLength(2);
    expect(read.contributions[0]).toMatchObject({
      memberNo: "1",
      period: "2020-06",
      amountCents: 130_000,
    });
    expect(read.contributions.every((row) => row.amountCents < 1_000_000)).toBe(true);
  });

  it("places a year-only event in the next month for that year", async () => {
    const book = await kwanBook();
    const sheet = book.getWorksheet("Detailed Data");
    if (!sheet) throw new Error("missing sheet");
    cell(sheet, 5, 7, 300);
    cell(sheet, 6, 7, 300);
    const read = parseKwanWorkbook(book);
    expect(read.contributions.map((row) => row.period).sort()).toEqual([
      "2020-06",
      "2020-06",
      "2021-01",
      "2021-01",
    ]);
  });

  it("uses the adapter automatically when a treasurer uploads the same sheet", async () => {
    const book = await kwanBook();
    const bytes = await book.xlsx.writeBuffer();
    const read = await readUpload(Buffer.from(bytes), "kwan-june.xlsx");
    expect(read.members).toHaveLength(0);
    expect(read.contributions).toHaveLength(2);
    expect(read.contributions[0]?.period).toBe("2020-06");
    expect(placeholderPhone("7")).toBe("+254790000007");
  });
});
