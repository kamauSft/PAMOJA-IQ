import { afterEach, describe, expect, it, vi } from "vitest";
import { applyPhoneColumn, columnsFromReply, maskPhones, notesFromReply } from "@/lib/import/column-assist";
import type { NoteSheet } from "@/lib/import/workbook";
import { readUpload } from "@/lib/import/workbook";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("column helper", () => {
  it("hides a phone and leaves a name and an amount", () => {
    expect(maskPhones("Amina 0712 345 005 paid 1,500")).toBe("Amina [phone] paid 1,500");
    expect(maskPhones("call +254712345002")).toBe("call [phone]");
    expect(maskPhones("Ksh 2,000")).toBe("Ksh 2,000");
  });

  it("keeps a column map only when the month is written in the sheet", () => {
    const columns = columnsFromReply(
      {
        columns: [
          { index: 0, kind: "name" },
          { index: 1, kind: "amount" },
          { index: 2, kind: "month", period: "2026-11" },
        ],
      },
      ["Who", "Cash received", "Oct"],
      "Umoja October 2026",
    );
    expect(columns?.map((column) => column.kind)).toEqual(["name", "amount", "month"]);
    expect(columns?.[2]).toEqual({ kind: "month", period: "2026-10" });
    expect(columnsFromReply({ columns: [{ index: 1, kind: "amount" }] }, ["Who", "Cash"], "")).toBeNull();
  });

  it("leaves an unfamiliar sheet unread until the helper is switched on", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const csv = "Umoja October 2026\nWho,Cash received,Reach\nAmina Hassan,1500,0712 345 005\n";
    const unread = await readUpload(Buffer.from(csv), "odd.csv");
    expect(unread.contributions).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("names the columns, then counts the money here", async () => {
    vi.stubEnv("ENABLE_AI_IMPORT", "true");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const csv = "Umoja October 2026\nWho,Cash received,Reach\nAmina Hassan,1500,0712 345 005\n";
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(String(url)).not.toContain("test-key");
      expect(String(init.headers && JSON.stringify(init.headers))).toContain("test-key");
      const sent = JSON.parse(String(init.body)) as { contents: { parts: { text: string }[] }[] };
      const text = sent.contents[0].parts[0].text;
      expect(text).not.toContain("0712");
      expect(text).toContain("[phone]");
      expect(text).toContain("Who");
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      columns: [
                        { index: 0, kind: "name" },
                        { index: 1, kind: "amount" },
                        { index: 2, kind: "phone" },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const read = await readUpload(Buffer.from(csv), "odd.csv");
    expect(read.contributions).toEqual([
      expect.objectContaining({ name: "Amina Hassan", period: "2026-10", amountCents: 150_000, phone: "+254712345005" }),
    ]);
    expect(read.members[0]?.phone).toBe("+254712345005");
    expect(read.problems).toEqual([]);
  });

  it("treats a column of phone numbers as a phone when the heading is odd", () => {
    const columns = applyPhoneColumn(
      [
        { kind: "name" },
        { kind: "amount" },
        { kind: "skip" },
      ],
      [["Amina Hassan", "1500", "0712 345 005"]],
    );
    expect(columns.map((column) => column.kind)).toEqual(["name", "amount", "phone"]);
  });

  it("reads a messy line only when the name and the amount are written there", () => {
    const sheet: NoteSheet = {
      sheetName: "sheet1",
      titleText: "October 2026",
      lines: [{ rowNumber: 2, text: "Amina Hassan 0712345005 paid 1500 for October" }],
      truncated: false,
    };
    const read = notesFromReply({ lines: [{ row: 2, name: "Amina Hassan", amount: "1500" }] }, sheet);
    expect(read?.contributions).toEqual([
      expect.objectContaining({ name: "Amina Hassan", phone: "+254712345005", period: "2026-10", amountCents: 150_000 }),
    ]);
    expect(read?.members[0]?.phone).toBe("+254712345005");
    const invented = notesFromReply({ lines: [{ row: 2, name: "Peter Otieno", amount: "9999" }] }, sheet);
    expect(invented?.contributions).toEqual([]);
    expect(invented?.members).toEqual([]);
  });

  it("asks the helper to read a messy line and still counts the written amount", async () => {
    vi.stubEnv("ENABLE_AI_IMPORT", "true");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const csv = "October 2026\nAmina Hassan 0712345005 paid 1500 for October\n";
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(String(url)).not.toContain("test-key");
      const sent = JSON.parse(String(init.body)) as { contents: { parts: { text: string }[] }[] };
      const text = sent.contents[0].parts[0].text;
      expect(text).not.toContain("0712");
      expect(text).toContain("[phone]");
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ lines: [{ row: 2, name: "Amina Hassan", amount: "1500" }] }) }] } }],
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const read = await readUpload(Buffer.from(csv), "note.csv");
    expect(read.contributions).toEqual([
      expect.objectContaining({ name: "Amina Hassan", phone: "+254712345005", period: "2026-10", amountCents: 150_000 }),
    ]);
    expect(read.members).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
