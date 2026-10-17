import { describe, expect, it } from "vitest";
import {
  borrowRoomCents,
  groupOnTimeLabel,
  onTimeStreak,
  savingsBars,
  shortMonth,
  statementShareText,
} from "@/lib/member/stats";

describe("member statistics", () => {
  it("counts an on-time streak and hides a small group's rate", () => {
    expect(onTimeStreak(["PAID", "PAID", "LATE", "PAID", "NOT_DUE"])).toBe(1);
    expect(onTimeStreak(["PAID", "PAID", "PAID"])).toBe(3);
    expect(onTimeStreak(["MISSED"])).toBe(0);
    expect(onTimeStreak(["PAID", "NOT_DUE"])).toBe(1);
    expect(groupOnTimeLabel(["PAID", "PAID", "PAID", "MISSED"])).toBeNull();
    expect(groupOnTimeLabel(["PAID", "PAID", "PAID", "PAID", "LATE"])).toBe("80.0%");
  });

  it("grows savings across months and caps borrowing at zero", () => {
    const bars = savingsBars(
      ["2026-01", "2026-02"],
      [
        { period: "2025-12", amountCents: 100 },
        { period: "2026-01", amountCents: 50 },
        { period: "2026-02", amountCents: 50 },
      ],
    );
    expect(bars.map((bar) => bar.cents)).toEqual([150, 200]);
    expect(bars.map((bar) => bar.height)).toEqual([75, 100]);
    expect(
      borrowRoomCents({ savingsCents: 3_600_000, loanBalanceCents: 1_260_000, savingsMultiple: 3 }),
    ).toBe(9_540_000);
    expect(borrowRoomCents({ savingsCents: 100, loanBalanceCents: 500, savingsMultiple: 3 })).toBe(0);
    expect(shortMonth("2026-10", "en")).toBe("Oct");
    expect(shortMonth("2026-10", "sw")).toBe("Okt");
  });

  it("shares only the lines it is given", () => {
    const text = statementShareText({
      personName: "Amina Hassan",
      chamaName: "Umoja Savings Group",
      lines: [{ label: "Savings", value: "KES 36,000" }],
    });
    expect(text).toBe("Amina Hassan\nUmoja Savings Group\nSavings KES 36,000");
    expect(text).not.toMatch(/Peter|Grace/);
  });
});
