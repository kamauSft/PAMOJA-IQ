import { parseChamaSettings } from "@/lib/chama/rules";
import { contributionCell, periodLabel } from "@/lib/chama/picture";
import { getDb } from "@/lib/db";
import {
  arrears,
  finesDue,
  formatKes,
  loanBalance,
  memberNetPosition,
  memberSavings,
  periodOf,
} from "@/lib/finance";
import { assertCanReadMembership, type MembershipRoleName } from "@/lib/tenancy/context";

export type AskFacts = {
  audience: "member" | "desk";
  locale: "en" | "sw";
  period: string;
  savings: string;
  loansStillOpen: string;
  finesStillOpen: string;
  contributionsStillOpen: string;
  net: string;
  paymentsNotShared: number | null;
  activeMembers: number | null;
  missedNames: string[] | null;
  thisMonth: "PAID" | "LATE" | "MISSED" | "NOT_DUE" | null;
};

export type AskTopic = "whoMissed" | "savings" | "loans" | "fines" | "net" | "unshared" | "thisMonth" | "position";

const OPEN_LOAN = new Set(["DISBURSED", "ACTIVE", "DEFAULTED"]);

export function figuresForHelper(facts: AskFacts): Record<string, string | number> {
  const figures: Record<string, string | number> = {
    speakingAbout: facts.audience === "desk" ? "the treasurer desk" : "this member only",
    period: facts.period,
    savings: facts.savings,
    loansStillOpen: facts.loansStillOpen,
    finesStillOpen: facts.finesStillOpen,
    contributionsStillOpen: facts.contributionsStillOpen,
    net: facts.net,
  };
  if (facts.paymentsNotShared != null) figures.paymentsNotShared = facts.paymentsNotShared;
  if (facts.activeMembers != null) figures.activeMembers = facts.activeMembers;
  return figures;
}

export function questionTopic(question: string): AskTopic {
  const text = question.toLowerCase();
  if (asksWhoMissed(question)) return "whoMissed";
  if (/not shared|hayajashiriki|unpublished|have not shared|haven't shared/.test(text)) return "unshared";
  if (/\b(loan|loans|mkopo|mikopo)\b/.test(text)) return "loans";
  if (/\b(fine|fines|faini)\b/.test(text)) return "fines";
  if (/\b(saving|savings|akiba)\b/.test(text)) return "savings";
  if (/\b(net|salio)\b/.test(text)) return "net";
  if (/\b(position|nafasi)\b/.test(text)) return "position";
  if (/this month|mwezi huu|mwezi/.test(text)) return "thisMonth";
  return "position";
}

export function asksWhoMissed(question: string): boolean {
  const text = question.toLowerCase();
  if (/\b(loan|loans|mkopo|mikopo|fine|fines|faini)\b/.test(text) && !/contribut|changia|michango/.test(text)) {
    return false;
  }
  const who = /\b(who|nani)\b/.test(text) || /hawaja|hajachangia|has not|have not|hasn't|haven't|not contribut/.test(text);
  const aboutContrib = /contribut|changia|michango|paid|lipa|anything|chochote|this month|mwezi/.test(text);
  return who && aboutContrib;
}

export function whoMissedSentence(facts: AskFacts): string {
  if (facts.audience === "member") return ownMonthSentence(facts);
  const names = facts.missedNames ?? [];
  if (facts.locale === "sw") {
    if (names.length === 0) return `Kila mwanachama aliyetakiwa amechangia kitu ${facts.period}.`;
    return `Hawa hawajachangia chochote ${facts.period}: ${names.join(", ")}.`;
  }
  if (names.length === 0) return `Every member who was due has paid something for ${facts.period}.`;
  return `These members have not paid anything for ${facts.period}: ${names.join(", ")}.`;
}

function ownMonthSentence(facts: AskFacts): string {
  const period = facts.period;
  if (facts.locale === "sw") {
    if (facts.thisMonth === "PAID") return `Umelipa ${period}.`;
    if (facts.thisMonth === "LATE") return `Umelipa ${period}, baada ya tarehe.`;
    if (facts.thisMonth === "NOT_DUE") return `${period} haijatakiwa bado.`;
    return `Hujachangia chochote ${period}.`;
  }
  if (facts.thisMonth === "PAID") return `You have paid for ${period}.`;
  if (facts.thisMonth === "LATE") return `You paid for ${period}, after the due date.`;
  if (facts.thisMonth === "NOT_DUE") return `${period} is not due yet.`;
  return `You have not paid anything for ${period}.`;
}

export function sentenceFor(facts: AskFacts, topic: AskTopic): string {
  const sw = facts.locale === "sw";
  if (topic === "whoMissed") return whoMissedSentence(facts);
  if (topic === "thisMonth") {
    if (facts.audience === "desk") {
      const count = facts.missedNames?.length ?? 0;
      return sw
        ? `Wanachama ${count} hawajachangia chochote ${facts.period}.`
        : `${count} members have not paid anything for ${facts.period}.`;
    }
    return ownMonthSentence(facts);
  }
  if (topic === "savings") {
    return sw
      ? facts.audience === "desk"
        ? `Akiba kwenye daftari ni ${facts.savings}.`
        : `Akiba yako ni ${facts.savings}.`
      : facts.audience === "desk"
        ? `The desk savings are ${facts.savings}.`
        : `Your savings are ${facts.savings}.`;
  }
  if (topic === "loans") {
    return sw ? `Mikopo iliyo wazi ni ${facts.loansStillOpen}.` : `Loans still open are ${facts.loansStillOpen}.`;
  }
  if (topic === "fines") {
    return sw ? `Faini zilizo wazi ni ${facts.finesStillOpen}.` : `Fines still open are ${facts.finesStillOpen}.`;
  }
  if (topic === "net") {
    return sw
      ? facts.audience === "desk"
        ? `Salio la daftari ni ${facts.net}.`
        : `Salio lako ni ${facts.net}.`
      : facts.audience === "desk"
        ? `The net position is ${facts.net}.`
        : `Your net position is ${facts.net}.`;
  }
  if (topic === "unshared") {
    if (facts.audience === "member") return ownMonthSentence(facts);
    const count = facts.paymentsNotShared ?? 0;
    return sw
      ? `Malipo ${count} ya ${facts.contributionsStillOpen} bado hayajashirikiwa.`
      : `${count} payments, ${facts.contributionsStillOpen}, have not been shared.`;
  }
  return fallbackSentence(facts);
}

export function topicFigures(facts: AskFacts, topic: AskTopic): Record<string, string | number> {
  if (topic === "savings") return { savings: facts.savings };
  if (topic === "loans") return { loansStillOpen: facts.loansStillOpen };
  if (topic === "fines") return { finesStillOpen: facts.finesStillOpen };
  if (topic === "net") return { net: facts.net };
  if (topic === "thisMonth") return { period: facts.period, thisMonth: facts.thisMonth ?? "unknown" };
  if (topic === "unshared" && facts.audience === "desk") {
    return { paymentsNotShared: facts.paymentsNotShared ?? 0, amountNotShared: facts.contributionsStillOpen };
  }
  return figuresForHelper(facts);
}

export function fallbackSentence(facts: AskFacts): string {
  if (facts.audience === "desk") {
    const count = facts.paymentsNotShared ?? 0;
    const members = facts.activeMembers ?? 0;
    if (facts.locale === "sw") {
      return `Akiba kwenye daftari ni ${facts.savings}. Kilicho wazi: mikopo ${facts.loansStillOpen}, faini ${facts.finesStillOpen}. Malipo ${count} ya ${facts.contributionsStillOpen} bado hayajashirikiwa. Salio ni ${facts.net}. Wanachama hai ni ${members}.`;
    }
    return `The desk savings are ${facts.savings}. Still open: loans ${facts.loansStillOpen}, fines ${facts.finesStillOpen}. ${count} payments, ${facts.contributionsStillOpen}, have not been shared. The net position is ${facts.net}. There are ${members} active members.`;
  }
  if (facts.locale === "sw") {
    return `Akiba yako ni ${facts.savings}. Kilicho wazi: mikopo ${facts.loansStillOpen}, faini ${facts.finesStillOpen}, michango ${facts.contributionsStillOpen}. Salio lako ni ${facts.net}.`;
  }
  return `Your savings are ${facts.savings}. Still open: loans ${facts.loansStillOpen}, fines ${facts.finesStillOpen}, contributions ${facts.contributionsStillOpen}. Your net position is ${facts.net}.`;
}

function moneyWhole(label: string): string {
  const cleaned = label.replace(/,/g, "").replace(/KES\s*/i, "");
  const whole = cleaned.split(".")[0]?.replace(/\D/g, "") ?? "";
  return whole || "0";
}

export function answerStaysWithFacts(answer: string, facts: AskFacts, topic: AskTopic = "position"): boolean {
  if (/\b(borrow|borrowing|kopa|ukope|kukopa|omba mkopo|take a loan|get a loan)\b/i.test(answer)) return false;
  if (/\b(shame|aibu|umefeli|you failed)\b/i.test(answer)) return false;
  const allowed = new Set<string>();
  for (const match of JSON.stringify(topicFigures(facts, topic)).matchAll(/\d[\d,]*/g)) {
    allowed.add(match[0].replace(/,/g, ""));
  }
  for (const match of answer.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
    const whole = match[0].replace(/,/g, "").split(".")[0] ?? "";
    if (whole.length < 2) continue;
    if (!allowed.has(whole)) return false;
  }
  const needed = moneyWhole(neededLabel(facts, topic));
  if (!needed) return true;
  if (needed === "0") return /\b0\b/.test(answer);
  return answer.replace(/,/g, "").includes(needed);
}

function neededLabel(facts: AskFacts, topic: AskTopic): string {
  if (topic === "savings") return facts.savings;
  if (topic === "loans") return facts.loansStillOpen;
  if (topic === "fines") return facts.finesStillOpen;
  if (topic === "net" || topic === "position") return facts.net;
  if (topic === "unshared") return facts.audience === "desk" ? facts.contributionsStillOpen : facts.period;
  if (topic === "thisMonth") return facts.period;
  return facts.net;
}

export async function loadAskFacts(input: {
  membershipId: string;
  role: MembershipRoleName;
  locale: "en" | "sw";
  asOf: Date;
}): Promise<AskFacts> {
  if (input.role === "TREASURER" || input.role === "CHAIR") return loadDeskFacts(input.locale, input.asOf);
  return loadMemberFacts(input.membershipId, input.locale, input.asOf);
}

async function loadMemberFacts(membershipId: string, locale: "en" | "sw", asOf: Date): Promise<AskFacts> {
  assertCanReadMembership(membershipId);
  const db = getDb();
  const membership = await db.membership.findFirst({
    where: { id: membershipId },
    include: {
      chama: true,
      contributions: { where: { publishedAt: { not: null } } },
      fines: true,
      loans: { include: { installments: true } },
    },
  });
  if (!membership) throw new Error("Membership is missing");
  const settings = parseChamaSettings(membership.chama.settings);
  const openLoans = membership.loans.filter((loan) => OPEN_LOAN.has(loan.status));
  const installments = openLoans.flatMap((loan) => loan.installments);
  const savingsCents = memberSavings(membership.contributions);
  const loanBalanceCents = loanBalance(installments);
  const finesCents = finesDue(membership.fines);
  const position = memberNetPosition({ savingsCents, loanBalanceCents, finesCents });
  const stillOpen = arrears({
    monthlyContributionCents: settings.monthlyContributionCents,
    contributionDueDay: settings.contributionDueDay,
    joinDate: membership.joinDate,
    exitDate: membership.exitDate,
    contributions: membership.contributions.map((row) => ({ period: row.period, amountCents: row.amountCents })),
    asOf,
  });
  return {
    audience: "member",
    locale,
    period: periodLabel(periodOf(asOf)),
    savings: formatKes(position.savingsCents),
    loansStillOpen: formatKes(position.loanBalanceCents),
    finesStillOpen: formatKes(position.finesCents),
    contributionsStillOpen: formatKes(stillOpen.totalOutstandingCents),
    net: formatKes(position.netCents),
    paymentsNotShared: null,
    activeMembers: null,
    missedNames: null,
    thisMonth: contributionCell({
      period: periodOf(asOf),
      dueDay: settings.contributionDueDay,
      monthlyCents: settings.monthlyContributionCents,
      joinDate: membership.joinDate,
      exitDate: membership.exitDate,
      payments: membership.contributions
        .filter((row) => row.period === periodOf(asOf))
        .map((row) => ({ amountCents: row.amountCents, date: row.datePaid })),
      asOf,
    }),
  };
}

async function loadDeskFacts(locale: "en" | "sw", asOf: Date): Promise<AskFacts> {
  const db = getDb();
  const [chama, rows] = await Promise.all([
    db.chama.findFirst(),
    db.membership.findMany({
    select: {
      status: true,
      memberNo: true,
      joinDate: true,
      exitDate: true,
      person: { select: { name: true } },
      contributions: { select: { amountCents: true, publishedAt: true, period: true, datePaid: true } },
      fines: { select: { amountCents: true, status: true } },
      loans: {
        select: {
          installments: {
            select: { principalDueCents: true, interestDueCents: true, paidAmountCents: true },
          },
        },
      },
    },
    }),
  ]);
  if (!chama) throw new Error("Chama is missing");
  const settings = parseChamaSettings(chama.settings);
  const period = periodOf(asOf);
  let savingsCents = 0;
  let unpublishedCents = 0;
  let unpublishedCount = 0;
  const fines = [];
  const installments = [];
  for (const row of rows) {
    for (const payment of row.contributions) {
      savingsCents += payment.amountCents;
      if (payment.publishedAt == null) {
        unpublishedCount += 1;
        unpublishedCents += payment.amountCents;
      }
    }
    fines.push(...row.fines);
    for (const loan of row.loans) installments.push(...loan.installments);
  }
  const loansCents = loanBalance(installments);
  const finesCents = finesDue(fines);
  const netCents = savingsCents - loansCents - finesCents;
  return {
    audience: "desk",
    locale,
    period: periodLabel(periodOf(asOf)),
    savings: formatKes(savingsCents),
    loansStillOpen: formatKes(loansCents),
    finesStillOpen: formatKes(finesCents),
    contributionsStillOpen: formatKes(unpublishedCents),
    net: formatKes(netCents),
    paymentsNotShared: unpublishedCount,
    activeMembers: rows.filter((row) => row.status === "ACTIVE").length,
    missedNames: missedThisMonth(rows, settings.contributionDueDay, settings.monthlyContributionCents, period, asOf),
    thisMonth: null,
  };
}

function missedThisMonth(
  rows: {
    status: string;
    memberNo: string;
    joinDate: Date;
    exitDate: Date | null;
    person: { name: string };
    contributions: { amountCents: number; period: string; datePaid: Date }[];
  }[],
  dueDay: number,
  monthlyCents: number,
  period: string,
  asOf: Date,
): string[] {
  const missed = rows.flatMap((row) => {
    if (row.status !== "ACTIVE") return [];
    const payments = row.contributions
      .filter((payment) => payment.period === period)
      .map((payment) => ({ amountCents: payment.amountCents, date: payment.datePaid }));
    const paid = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
    const cell = contributionCell({
      period,
      dueDay,
      monthlyCents,
      joinDate: row.joinDate,
      exitDate: row.exitDate,
      payments,
      asOf,
    });
    if (cell !== "MISSED" || paid !== 0) return [];
    return [{ memberNo: row.memberNo, label: `${row.person.name} (${row.memberNo})` }];
  });
  missed.sort((a, b) => a.memberNo.localeCompare(b.memberNo));
  return missed.map((row) => row.label);
}
