import { afterEach, describe, expect, it } from "vitest";
import { encouragement } from "@/content/encouragement";
import { hashPin } from "@/lib/auth/pin";
import { publishNotice, publishPositions } from "@/lib/chama/publish";
import { createSavingsGoal, updateSavingsGoal } from "@/lib/goals/create";
import { goalProgress } from "@/lib/goals/progress";
import { prismaRaw } from "@/lib/db";
import { loadMemberHome } from "@/lib/member/home";
import { personalLine, quoteForDay } from "@/lib/quotes/daily";
import { umojaSettings } from "@/lib/chama/rules";
import { runWithTenant } from "@/lib/tenancy/context";
import { resetDatabase } from "./db";

afterEach(async () => {
  await resetDatabase();
});

describe("daily word", () => {
  it("changes with the Nairobi day and stays short", () => {
    expect(encouragement.en).toHaveLength(encouragement.sw.length);
    expect(encouragement.en.length).toBeGreaterThanOrEqual(30);
    for (const line of [...encouragement.en, ...encouragement.sw]) {
      expect(line.length).toBeGreaterThan(10);
      expect(line.length).toBeLessThanOrEqual(160);
    }
    expect(new Set(encouragement.en).size).toBe(encouragement.en.length);
    const first = quoteForDay(new Date("2026-10-17T06:00:00.000Z"));
    const later = quoteForDay(new Date("2026-10-17T20:00:00.000Z"));
    const next = quoteForDay(new Date("2026-10-18T06:00:00.000Z"));
    expect(first.day).toBe("2026-10-17");
    expect(later.text).toBe(first.text);
    expect(next.text).not.toBe(first.text);
    expect(personalLine({ locale: "en", thisMonth: "MISSED" })).not.toMatch(/KES|arrears|fine/i);
    expect(publishNotice()).not.toMatch(/\d|KES/);
  });
});

describe("goals and published books", () => {
  it("tracks a goal against savings and hides an upload until it is shared", async () => {
    expect(
      goalProgress({
        savedCents: 200_000,
        targetCents: 400_000,
        startedAt: new Date("2026-01-01T00:00:00.000Z"),
        targetDate: new Date("2026-12-31T00:00:00.000Z"),
        asOf: new Date("2026-01-02T00:00:00.000Z"),
      }).pace,
    ).toBe("on_track");

    const chama = await prismaRaw.chama.create({
      data: { name: "Ready", settings: umojaSettings, plan: "PRO", status: "ACTIVE" },
    });
    const person = await prismaRaw.person.create({
      data: { name: "Asha Njeri", phone: "+254711000222", channelPrefs: {}, consent: {} },
    });
    const membership = await prismaRaw.membership.create({
      data: {
        chamaId: chama.id,
        personId: person.id,
        role: "MEMBER",
        memberNo: "M001",
        joinDate: new Date("2026-01-01T00:00:00.000Z"),
        hashedPin: await hashPin("2468"),
      },
    });
    const treasurer = await prismaRaw.person.create({
      data: { name: "Jane Wanjiku", phone: "+254711000333", channelPrefs: {}, consent: {} },
    });
    const office = await prismaRaw.membership.create({
      data: {
        chamaId: chama.id,
        personId: treasurer.id,
        role: "TREASURER",
        memberNo: "T001",
        joinDate: new Date("2026-01-01T00:00:00.000Z"),
        hashedPin: await hashPin("1357"),
      },
    });
    await prismaRaw.contribution.create({
      data: {
        chamaId: chama.id,
        membershipId: membership.id,
        amountCents: 200_000,
        period: "2026-10",
        datePaid: new Date("2026-10-02T00:00:00.000Z"),
        method: "CASH",
        source: "IMPORT",
      },
    });
    const hidden = await runWithTenant(
      { chamaId: chama.id, membershipId: membership.id, personId: person.id, role: "MEMBER" },
      () => loadMemberHome(membership.id, new Date("2026-10-16T00:00:00.000Z")),
    );
    expect(hidden.position.savingsCents).toBe(0);

    const shared = await publishPositions({
      chamaId: chama.id,
      actor: { membershipId: office.id, personId: treasurer.id, role: "TREASURER" },
    });
    expect(shared).toEqual({ published: 1, members: 1 });
    const note = await prismaRaw.notification.findFirstOrThrow();
    expect(note.body).toBe(publishNotice());
    expect(note.body).not.toMatch(/Asha|Jane|KES|\d/);

    const visible = await runWithTenant(
      { chamaId: chama.id, membershipId: membership.id, personId: person.id, role: "MEMBER" },
      () => loadMemberHome(membership.id, new Date("2026-10-16T00:00:00.000Z")),
    );
    expect(visible.position.savingsCents).toBe(200_000);
    expect(visible.group).toBeNull();
    expect(visible.borrowRoomCents).toBe(600_000);
    expect(visible.streak).toBe(1);
    expect(visible.months).toHaveLength(12);

    const created = await createSavingsGoal({
      chamaId: chama.id,
      membershipId: membership.id,
      title: "School fees",
      targetShillings: 4000,
      targetDate: "2027-06-01",
    });
    expect(created).toEqual({ ok: true });
    const home = await runWithTenant(
      { chamaId: chama.id, membershipId: membership.id, personId: person.id, role: "MEMBER" },
      () => loadMemberHome(membership.id, new Date("2026-10-16T00:00:00.000Z")),
    );
    expect(home.goals[0]?.title).toBe("School fees");
    expect(home.goals[0]?.percent).toBe(50);
    const changed = await updateSavingsGoal({
      chamaId: chama.id,
      membershipId: membership.id,
      goalId: home.goals[0]!.id,
      title: "School fees for Asha",
      targetShillings: 5000,
      targetDate: "2027-08-01",
    });
    expect(changed).toEqual({ ok: true });
    const blocked = await updateSavingsGoal({
      chamaId: chama.id,
      membershipId: office.id,
      goalId: home.goals[0]!.id,
      title: "Not yours",
      targetShillings: 5000,
      targetDate: "2027-08-01",
    });
    expect(blocked.ok).toBe(false);
  });
});
