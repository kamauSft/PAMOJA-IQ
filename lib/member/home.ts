import { auditIsIntact } from "../audit/intact";
import { openingPeriod, periodsBetween, periodLabel } from "../chama/picture";
import { parseChamaSettings } from "../chama/rules";
import { getDb } from "../db";
import {
  arrears,
  compareDateOnly,
  dueDateForPeriod,
  finesDue,
  formatKes,
  installmentRemaining,
  loanBalance,
  memberNetPosition,
  memberSavings,
  overdueInstallments,
  periodOf,
} from "../finance";
import { chooseMotivation } from "../motivation/engine";
import { goalProgress } from "../goals/progress";
import { assertCanReadMembership, TenantIsolationError } from "../tenancy/context";
import { borrowRoomCents, groupOnTimeLabel, monthMarks, onTimeStreak, recentPeriods, savingsBars, shortMonth } from "./stats";

export async function loadMemberHome(membershipId: string, asOf = new Date(), locale: "en" | "sw" = "en") {
  assertCanReadMembership(membershipId);
  const db = getDb();
  const membership = await db.membership.findFirst({
    where: { id: membershipId },
    include: { person: true, chama: true },
  });
  if (!membership) throw new TenantIsolationError("Membership is not in this chama");

  const period = periodOf(asOf);
  const [contributions, fines, loans, goals, auditIntact, shared, activeMembers, roster, groupInstallments] =
    await Promise.all([
      db.contribution.findMany({ where: { membershipId, publishedAt: { not: null } } }),
      db.fine.findMany({ where: { membershipId } }),
      db.loan.findMany({ where: { membershipId }, include: { installments: true } }),
      db.savingsGoal.findMany({ where: { membershipId }, orderBy: { createdAt: "desc" } }),
      auditIsIntact(),
      db.contribution.findMany({ where: { publishedAt: { not: null } }, select: { amountCents: true } }),
      db.membership.count({ where: { status: "ACTIVE" } }),
      db.membership.findMany({
        where: { status: "ACTIVE" },
        select: {
          joinDate: true,
          exitDate: true,
          contributions: {
            where: { publishedAt: { not: null }, period },
            select: { amountCents: true, datePaid: true },
          },
        },
      }),
      db.loanInstallment.findMany({
        select: { principalDueCents: true, interestDueCents: true, paidAmountCents: true },
      }),
    ]);

  const settings = parseChamaSettings(membership.chama.settings);
  const openLoans = loans.filter((loan) => ["DISBURSED", "ACTIVE", "DEFAULTED"].includes(loan.status));
  const installments = openLoans.flatMap((loan) => loan.installments);
  const savingsCents = memberSavings(contributions);
  const loanBalanceCents = loanBalance(installments);
  const finesCents = finesDue(fines);
  const position = memberNetPosition({ savingsCents, loanBalanceCents, finesCents });
  const arrearsReport = arrears({
    monthlyContributionCents: settings.monthlyContributionCents,
    contributionDueDay: settings.contributionDueDay,
    joinDate: membership.joinDate,
    exitDate: membership.exitDate,
    contributions: contributions.map((contribution) => ({
      period: contribution.period,
      amountCents: contribution.amountCents,
    })),
    asOf,
  });
  const lateInstallments = overdueInstallments(installments, asOf);
  const thisMonth = monthMarks({
    periods: [period],
    dueDay: settings.contributionDueDay,
    monthlyCents: settings.monthlyContributionCents,
    joinDate: membership.joinDate,
    exitDate: membership.exitDate,
    payments: contributions.map((row) => ({
      period: row.period,
      amountCents: row.amountCents,
      date: row.datePaid,
    })),
    asOf,
  })[0]!.cell;
  const history = monthMarks({
    periods: periodsBetween(openingPeriod(membership.joinDate, settings.contributionDueDay), period),
    dueDay: settings.contributionDueDay,
    monthlyCents: settings.monthlyContributionCents,
    joinDate: membership.joinDate,
    exitDate: membership.exitDate,
    payments: contributions.map((row) => ({
      period: row.period,
      amountCents: row.amountCents,
      date: row.datePaid,
    })),
    asOf,
  });
  const window = recentPeriods(asOf, 12);
  const bars = savingsBars(
    window,
    contributions.map((row) => ({ period: row.period, amountCents: row.amountCents })),
  );
  const room = borrowRoomCents({
    savingsCents,
    loanBalanceCents,
    savingsMultiple: settings.maxLoanSavingsMultiple,
  });
  const onTimeCells = roster.map(
    (member) =>
      monthMarks({
        periods: [period],
        dueDay: settings.contributionDueDay,
        monthlyCents: settings.monthlyContributionCents,
        joinDate: member.joinDate,
        exitDate: member.exitDate,
        payments: member.contributions.map((row) => ({
          period,
          amountCents: row.amountCents,
          date: row.datePaid,
        })),
        asOf,
      })[0]!.cell,
  );
  const shown = monthMarks({
    periods: window,
    dueDay: settings.contributionDueDay,
    monthlyCents: settings.monthlyContributionCents,
    joinDate: membership.joinDate,
    exitDate: membership.exitDate,
    payments: contributions.map((row) => ({
      period: row.period,
      amountCents: row.amountCents,
      date: row.datePaid,
    })),
    asOf,
  });
  const groupCents = shared.reduce((sum, row) => sum + row.amountCents, 0);
  const nextInstallment = openLoans
    .flatMap((loan) =>
      loan.installments.map((installment) => ({
        purpose: loan.purpose,
        dueDate: installment.dueDate,
        remainingCents: installmentRemaining(installment),
      })),
    )
    .filter((row) => row.remainingCents > 0)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

  const due = dueDateForPeriod(period, settings.contributionDueDay);
  const previous = bars.length >= 4 ? bars[bars.length - 4]!.cents : savingsCents;
  const principalCents = openLoans.reduce((sum, loan) => sum + loan.principalCents, 0);
  const weekAgo = new Date(asOf.getTime() - 7 * 86_400_000);
  const motivation = chooseMotivation({
    membershipId,
    firstName: membership.person.name.split(" ")[0] || membership.person.name,
    chamaName: membership.chama.name,
    locale,
    asOf,
    savingsCents,
    previousSavingsCents: previous,
    monthsSaving: history.filter((mark) => mark.cell === "PAID" || mark.cell === "LATE").length,
    thisMonth,
    paidEarly:
      thisMonth === "PAID" &&
      contributions.some((row) => row.period === period && compareDateOnly(row.datePaid, due) < 0),
    monthName: shortMonth(period, locale),
    dueDate: due.toISOString().slice(0, 10),
    daysUntilDue: Math.round((due.getTime() - Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate())) / 86_400_000),
    streak: onTimeStreak(history.map((mark) => mark.cell)),
    growthCents: Math.max(0, savingsCents - previous),
    finesCents,
    loanBalanceCents,
    loanPrincipalCents: principalCents,
    loanClearedThisWeek: loans.some((loan) => loan.status === "PAID" && loan.updatedAt >= weekAgo && loan.updatedAt <= asOf),
    joinDate: membership.joinDate,
    monthlyDueCents: settings.monthlyContributionCents,
    goals: goals.map((goal) => {
      const progress = goalProgress({
        savedCents: savingsCents,
        targetCents: goal.targetCents,
        startedAt: goal.createdAt,
        targetDate: goal.targetDate,
        asOf,
      });
      return { title: goal.title, percent: progress.percent, remainingCents: progress.remainingCents };
    }),
    recentTemplateIds: [],
  });

  return {
    chamaName: membership.chama.name,
    county: membership.chama.county,
    personName: membership.person.name,
    role: membership.role,
    memberNo: membership.memberNo,
    status: membership.status,
    position,
    savingsLabel: formatKes(position.savingsCents),
    loanLabel: formatKes(position.loanBalanceCents),
    finesLabel: formatKes(position.finesCents),
    netLabel: formatKes(position.netCents),
    arrearsCents: arrearsReport.totalOutstandingCents,
    arrearsLabel: formatKes(arrearsReport.totalOutstandingCents),
    overdueInstallmentCents: lateInstallments.reduce((sum, row) => sum + row.remainingCents, 0),
    auditIntact,
    period,
    periodLabel: periodLabel(period),
    motivation,
    thisMonth,
    monthlyDueLabel: formatKes(settings.monthlyContributionCents),
    nextInstallment: nextInstallment
      ? {
          purpose: nextInstallment.purpose,
          dueDate: nextInstallment.dueDate.toISOString().slice(0, 10),
          remainingLabel: formatKes(nextInstallment.remainingCents),
        }
      : null,
    goals: goals.map((goal) => {
      const progress = goalProgress({
        savedCents: savingsCents,
        targetCents: goal.targetCents,
        startedAt: goal.createdAt,
        targetDate: goal.targetDate,
        asOf,
      });
      return {
        id: goal.id,
        title: goal.title,
        targetLabel: formatKes(goal.targetCents),
        savedLabel: formatKes(savingsCents),
        targetShillings: Math.round(goal.targetCents / 100),
        targetDate: goal.targetDate.toISOString().slice(0, 10),
        progressBps: progress.percent * 100,
        percent: progress.percent,
        pace: progress.pace,
        remainingCents: progress.remainingCents,
      };
    }),
    shareLabel: activeMembers >= 5 && groupCents > 0 ? `${((savingsCents * 100) / groupCents).toFixed(1)}%` : null,
    streak: onTimeStreak(history.map((mark) => mark.cell)),
    months: shown,
    bars: bars.map((bar) => ({ period: bar.period, height: bar.height, label: formatKes(bar.cents) })),
    borrowRoomCents: room,
    borrowLabel: formatKes(room),
    oneLoan: openLoans.length > 0,
    group:
      activeMembers >= 5
        ? {
            savingsLabel: formatKes(groupCents),
            loansLabel: formatKes(loanBalance(groupInstallments)),
            onTimeLabel: groupOnTimeLabel(onTimeCells),
          }
        : null,
  };
}
