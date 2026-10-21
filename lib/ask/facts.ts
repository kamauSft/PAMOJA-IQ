import { parseChamaSettings } from "@/lib/chama/rules";
import { periodLabel } from "@/lib/chama/picture";
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
};

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

export function answerStaysWithFacts(answer: string, facts: AskFacts): boolean {
  if (/\b(borrow|borrowing|kopa|ukope|kukopa|omba mkopo|take a loan|get a loan)\b/i.test(answer)) return false;
  if (/\b(shame|aibu|umefeli|you failed)\b/i.test(answer)) return false;
  const allowed = new Set<string>();
  for (const match of JSON.stringify(figuresForHelper(facts)).matchAll(/\d[\d,]*/g)) {
    allowed.add(match[0].replace(/,/g, ""));
  }
  for (const match of answer.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
    const whole = match[0].replace(/,/g, "").split(".")[0] ?? "";
    if (whole.length < 2) continue;
    if (!allowed.has(whole)) return false;
  }
  const net = moneyWhole(facts.net);
  if (net === "0") return /\b0\b/.test(answer);
  return answer.replace(/,/g, "").includes(net);
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
  };
}

async function loadDeskFacts(locale: "en" | "sw", asOf: Date): Promise<AskFacts> {
  const db = getDb();
  const rows = await db.membership.findMany({
    select: {
      status: true,
      contributions: { select: { amountCents: true, publishedAt: true } },
      fines: { select: { amountCents: true, status: true } },
      loans: {
        select: {
          installments: {
            select: { principalDueCents: true, interestDueCents: true, paidAmountCents: true },
          },
        },
      },
    },
  });
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
  };
}
