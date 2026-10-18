import { describe, expect, it } from "vitest";
import { motivationTemplates } from "@/content/motivation-templates";
import { chooseMotivation, chooseSituation, crossedMilestone, motivationPush, allowPush, type MotivationFacts } from "@/lib/motivation/engine";

const day = new Date("2026-10-16T00:00:00.000Z");

function facts(overrides: Partial<MotivationFacts> = {}): MotivationFacts {
  return {
    membershipId: "member-1",
    firstName: "Amina",
    chamaName: "Umoja",
    locale: "en",
    asOf: day,
    savingsCents: 3_600_000,
    previousSavingsCents: 3_600_000,
    monthsSaving: 18,
    thisMonth: "PAID",
    paidEarly: false,
    monthName: "Oct",
    dueDate: "2026-10-05",
    daysUntilDue: -11,
    streak: 18,
    growthCents: 200_000,
    finesCents: 0,
    loanBalanceCents: 50_000,
    loanPrincipalCents: 200_000,
    loanClearedThisWeek: false,
    joinDate: new Date("2024-01-05T00:00:00.000Z"),
    monthlyDueCents: 200_000,
    goals: [],
    recentTemplateIds: [],
    ...overrides,
  };
}

describe("personal motivation", () => {
  it("gives every situation at least three wordings in English and Swahili", () => {
    for (const templates of Object.values(motivationTemplates)) {
      expect(templates.length).toBeGreaterThanOrEqual(3);
      for (const template of templates) {
        expect(template.en.length).toBeGreaterThan(0);
        expect(template.sw.length).toBeGreaterThan(0);
        expect(template.en.toLowerCase()).not.toMatch(/borrow|take a loan/);
        expect(template.sw.toLowerCase()).not.toMatch(/kopa/);
      }
    }
  });

  it("puts a cleared loan ahead of a long streak", () => {
    expect(chooseSituation(facts({ loanClearedThisWeek: true, streak: 18 }))).toBe("loan_cleared");
  });

  it("mentions a savings milestone only when the member has just crossed it", () => {
    expect(crossedMilestone(900_000, 1_200_000)).toBe(10_000);
    expect(crossedMilestone(1_200_000, 1_200_000)).toBeNull();
    const choice = chooseMotivation(facts({ previousSavingsCents: 900_000, savingsCents: 1_200_000, streak: 0, growthCents: 0 }));
    expect(choice.situation).toBe("milestone");
    expect(choice.message).toContain("10,000");
  });

  it("uses a fresh wording when another one has not been used", () => {
    const used = motivationTemplates.streak.map((template) => template.id).slice(0, 2);
    const choice = chooseMotivation(facts({ recentTemplateIds: used }));
    expect(choice.situation).toBe("streak");
    expect(used).not.toContain(choice.templateId);
  });

  it("keeps shilling amounts off the phone alert", () => {
    const choice = chooseMotivation(facts());
    expect(choice.message).toMatch(/KES|18/);
    expect(choice.push).not.toMatch(/\d|KES/);
    const shown = motivationPush({
      firstName: "Amina",
      situation: "streak",
      message: choice.message,
      proverb: null,
      showAmounts: true,
    });
    expect(shown).toBe(choice.message);
  });

  it("does not scold a member who is behind", () => {
    const choice = chooseMotivation(
      facts({
        thisMonth: "MISSED",
        streak: 0,
        growthCents: 0,
        paidEarly: false,
        savingsCents: 0,
        previousSavingsCents: 0,
        loanBalanceCents: 0,
        loanPrincipalCents: 0,
        finesCents: 0,
      }),
    );
    expect(choice.situation).toBe("overdue");
    expect(choice.message.toLowerCase()).not.toMatch(/fail|shame|lazy|behind/);
  });

  it("sends at most one motivation alert a day, and none during quiet hours", () => {
    const morning = new Date("2026-10-16T04:00:00.000Z");
    const night = new Date("2026-10-16T17:30:00.000Z");
    expect(allowPush({ now: morning, motivationSentToday: 0, pushesSentToday: 0, kind: "motivation" })).toBe(true);
    expect(allowPush({ now: morning, motivationSentToday: 1, pushesSentToday: 1, kind: "motivation" })).toBe(false);
    expect(allowPush({ now: morning, motivationSentToday: 1, pushesSentToday: 1, kind: "milestone" })).toBe(true);
    expect(allowPush({ now: morning, motivationSentToday: 1, pushesSentToday: 2, kind: "milestone" })).toBe(false);
    expect(allowPush({ now: night, motivationSentToday: 0, pushesSentToday: 0, kind: "motivation" })).toBe(false);
  });
});
