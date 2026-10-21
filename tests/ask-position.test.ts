import { afterEach, describe, expect, it } from "vitest";
import { answerStaysWithFacts, fallbackSentence, figuresForHelper, loadAskFacts, type AskFacts } from "@/lib/ask/facts";
import { phrasePosition } from "@/lib/ask/phrase";
import { hashPin } from "@/lib/auth/pin";
import { umojaSettings } from "@/lib/chama/rules";
import { prismaRaw } from "@/lib/db";
import { runWithTenant } from "@/lib/tenancy/context";
import { resetDatabase } from "./db";

afterEach(async () => {
  await resetDatabase();
  delete process.env.ENABLE_AI_IMPORT;
  delete process.env.GEMINI_API_KEY;
});

const asOf = new Date("2026-10-16T00:00:00.000Z");

function memberFacts(net = "KES 1,600"): AskFacts {
  return {
    audience: "member",
    locale: "en",
    period: "Oct 2026",
    savings: "KES 2,000",
    loansStillOpen: "KES 300",
    finesStillOpen: "KES 100",
    contributionsStillOpen: "KES 0",
    net,
    paymentsNotShared: null,
    activeMembers: null,
  };
}

describe("position answers", () => {
  it("keeps a reply that copies the net and drops an invented amount", () => {
    const facts = memberFacts();
    expect(answerStaysWithFacts("Your net position is KES 1,600.", facts)).toBe(true);
    expect(answerStaysWithFacts("Your net position is KES 9,999.", facts)).toBe(false);
    expect(answerStaysWithFacts("You should borrow. Your net position is KES 1,600.", facts)).toBe(false);
    expect(fallbackSentence(facts)).toContain("KES 1,600");
    expect(JSON.stringify(figuresForHelper(facts))).not.toContain("phone");
  });

  it("shows a member only their published position", async () => {
    const chama = await prismaRaw.chama.create({
      data: { name: "Ask", settings: umojaSettings, plan: "PRO", status: "ACTIVE" },
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
        joinDate: new Date("2026-10-01T00:00:00.000Z"),
        hashedPin: await hashPin("2468"),
      },
    });
    const other = await prismaRaw.person.create({
      data: { name: "Zawadi Secret", phone: "+254700111222", channelPrefs: {}, consent: {} },
    });
    const otherMembership = await prismaRaw.membership.create({
      data: {
        chamaId: chama.id,
        personId: other.id,
        role: "MEMBER",
        memberNo: "M002",
        joinDate: new Date("2026-10-01T00:00:00.000Z"),
        hashedPin: await hashPin("2468"),
      },
    });
    await prismaRaw.contribution.createMany({
      data: [
        {
          chamaId: chama.id,
          membershipId: membership.id,
          amountCents: 200_000,
          period: "2026-10",
          datePaid: new Date("2026-10-02T00:00:00.000Z"),
          method: "CASH",
          source: "IMPORT",
          publishedAt: new Date("2026-10-03T00:00:00.000Z"),
        },
        {
          chamaId: chama.id,
          membershipId: membership.id,
          amountCents: 50_000,
          period: "2026-09",
          datePaid: new Date("2026-09-02T00:00:00.000Z"),
          method: "CASH",
          source: "IMPORT",
        },
        {
          chamaId: chama.id,
          membershipId: otherMembership.id,
          amountCents: 900_000,
          period: "2026-10",
          datePaid: new Date("2026-10-02T00:00:00.000Z"),
          method: "CASH",
          source: "IMPORT",
          publishedAt: new Date("2026-10-03T00:00:00.000Z"),
        },
      ],
    });
    await prismaRaw.fine.create({
      data: {
        chamaId: chama.id,
        membershipId: membership.id,
        type: "LATE_CONTRIBUTION",
        amountCents: 10_000,
        date: asOf,
        status: "UNPAID",
      },
    });
    const loan = await prismaRaw.loan.create({
      data: {
        chamaId: chama.id,
        membershipId: membership.id,
        principalCents: 30_000,
        rateBps: 0,
        interestType: "FLAT",
        months: 1,
        purpose: "Stock",
        status: "ACTIVE",
        applicationDate: asOf,
      },
    });
    await prismaRaw.loanInstallment.create({
      data: {
        chamaId: chama.id,
        loanId: loan.id,
        dueDate: new Date("2026-11-05T00:00:00.000Z"),
        principalDueCents: 30_000,
        interestDueCents: 0,
        paidAmountCents: 0,
        status: "SCHEDULED",
      },
    });

    const facts = await runWithTenant(
      { chamaId: chama.id, membershipId: membership.id, personId: person.id, role: "MEMBER" },
      () => loadAskFacts({ membershipId: membership.id, role: "MEMBER", locale: "en", asOf }),
    );
    expect(facts.savings).toBe("KES 2,000");
    expect(facts.loansStillOpen).toBe("KES 300");
    expect(facts.finesStillOpen).toBe("KES 100");
    expect(facts.net).toBe("KES 1,600");
    expect(facts.paymentsNotShared).toBeNull();
    const packed = JSON.stringify(facts);
    expect(packed).not.toContain("Zawadi");
    expect(packed).not.toContain("700111222");
    expect(packed).not.toContain("11,500");
    expect(packed).not.toContain("KES 500");
  });

  it("lets the treasurer hear unpublished payments without names or phones", async () => {
    const chama = await prismaRaw.chama.create({
      data: { name: "Ask desk", settings: umojaSettings, plan: "PRO", status: "ACTIVE" },
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
    const person = await prismaRaw.person.create({
      data: { name: "Zawadi Secret", phone: "+254700111222", channelPrefs: {}, consent: {} },
    });
    const membership = await prismaRaw.membership.create({
      data: {
        chamaId: chama.id,
        personId: person.id,
        role: "MEMBER",
        memberNo: "M001",
        joinDate: new Date("2026-10-01T00:00:00.000Z"),
        hashedPin: await hashPin("2468"),
      },
    });
    await prismaRaw.contribution.create({
      data: {
        chamaId: chama.id,
        membershipId: membership.id,
        amountCents: 50_000,
        period: "2026-10",
        datePaid: new Date("2026-10-02T00:00:00.000Z"),
        method: "CASH",
        source: "IMPORT",
      },
    });

    const facts = await runWithTenant(
      { chamaId: chama.id, membershipId: office.id, personId: treasurer.id, role: "TREASURER" },
      () => loadAskFacts({ membershipId: office.id, role: "TREASURER", locale: "en", asOf }),
    );
    expect(facts.audience).toBe("desk");
    expect(facts.savings).toBe("KES 500");
    expect(facts.contributionsStillOpen).toBe("KES 500");
    expect(facts.paymentsNotShared).toBe(1);
    expect(facts.net).toBe("KES 500");
    const packed = JSON.stringify(figuresForHelper(facts));
    expect(packed).not.toContain("Zawadi");
    expect(packed).not.toContain("700111222");
    expect(packed).not.toContain("Jane");
  });

  it("uses the helper sentence only when the net is unchanged", async () => {
    const facts = memberFacts();
    process.env.ENABLE_AI_IMPORT = "true";
    process.env.GEMINI_API_KEY = "test-key";
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Your net position is KES 1,600." }] } }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as typeof fetch;
    const spoken = await phrasePosition("What is my position?", facts);
    expect(spoken).toBe("Your net position is KES 1,600.");
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Your net position is KES 9,000." }] } }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as typeof fetch;
    const rejected = await phrasePosition("What is my position?", facts);
    expect(rejected).toBe(fallbackSentence(facts));
    globalThis.fetch = original;
  });
});
