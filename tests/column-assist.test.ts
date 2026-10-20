import { afterEach, describe, expect, it, vi } from "vitest";
import { columnsFromReply, maskPhones } from "@/lib/import/column-assist";
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
});
