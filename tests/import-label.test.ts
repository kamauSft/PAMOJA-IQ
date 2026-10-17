import { describe, expect, it } from "vitest";
import { importFileLabel, importWhen } from "@/lib/chama/import-label";

describe("import labels", () => {
  it("keeps a file name short and dates it in Nairobi", () => {
    expect(importFileLabel("C:\\books\\umoja.xlsx")).toBe("umoja.xlsx");
    expect(importFileLabel("  ")).toBe("Excel");
    expect(importFileLabel("a".repeat(120))).toHaveLength(80);
    expect(importWhen(new Date("2026-10-16T21:30:00.000Z"))).toBe("17 Oct 2026");
  });
});
