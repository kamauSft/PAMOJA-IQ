import { describe, expect, it } from "vitest";
import { bubbleSize, importFileLabel, importWhen } from "@/lib/chama/bubbles";

describe("treasurer bubbles", () => {
  it("sizes a circle from savings and keeps a file name short", () => {
    expect(bubbleSize(0, 100)).toBe(56);
    expect(bubbleSize(100, 100)).toBe(128);
    expect(bubbleSize(25, 100)).toBeLessThan(bubbleSize(100, 100));
    expect(importFileLabel("C:\\books\\umoja.xlsx")).toBe("umoja.xlsx");
    expect(importFileLabel("  ")).toBe("Excel");
    expect(importFileLabel("a".repeat(120))).toHaveLength(80);
    expect(importWhen(new Date("2026-10-16T21:30:00.000Z"))).toBe("17 Oct 2026");
  });
});
