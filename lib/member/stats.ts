import { contributionCell, formatRateBps, type ContributionCell } from "../chama/picture";
import { periodOf, shiftPeriod } from "../finance";

const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  sw: ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ago", "Sep", "Okt", "Nov", "Des"],
} as const;

export function shortMonth(period: string, locale: "en" | "sw"): string {
  const month = Number(period.slice(5, 7));
  return MONTHS[locale][month - 1] ?? period;
}

export function recentPeriods(asOf: Date, count = 12): string[] {
  const end = periodOf(asOf);
  return Array.from({ length: count }, (_, index) => shiftPeriod(end, index - (count - 1)));
}

export function monthMarks(input: {
  periods: string[];
  dueDay: number;
  monthlyCents: number;
  joinDate: Date;
  exitDate: Date | null;
  payments: { period: string; amountCents: number; date: Date }[];
  asOf: Date;
}): { period: string; cell: ContributionCell }[] {
  return input.periods.map((period) => ({
    period,
    cell: contributionCell({
      period,
      dueDay: input.dueDay,
      monthlyCents: input.monthlyCents,
      joinDate: input.joinDate,
      exitDate: input.exitDate,
      payments: input.payments
        .filter((payment) => payment.period === period)
        .map((payment) => ({ amountCents: payment.amountCents, date: payment.date })),
      asOf: input.asOf,
    }),
  }));
}

/** Consecutive on-time months, ending at the latest month that was already due. */
export function onTimeStreak(cells: ContributionCell[]): number {
  let index = cells.length - 1;
  while (index >= 0 && cells[index] === "NOT_DUE") index -= 1;
  let streak = 0;
  while (index >= 0 && cells[index] === "PAID") {
    streak += 1;
    index -= 1;
  }
  return streak;
}

export function savingsBars(
  periods: string[],
  payments: { period: string; amountCents: number }[],
): { period: string; cents: number; height: number }[] {
  if (periods.length === 0) return [];
  const first = periods[0]!;
  let running = payments
    .filter((payment) => payment.period < first)
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  const rows = periods.map((period) => {
    running += payments
      .filter((payment) => payment.period === period)
      .reduce((sum, payment) => sum + payment.amountCents, 0);
    return { period, cents: running };
  });
  const peak = Math.max(...rows.map((row) => row.cents), 0);
  return rows.map((row) => ({
    ...row,
    height: peak <= 0 ? 0 : Math.round((Math.max(row.cents, 0) / peak) * 100),
  }));
}

/** Three times savings, less the loan still open. Never below zero. */
export function borrowRoomCents(input: {
  savingsCents: number;
  loanBalanceCents: number;
  savingsMultiple: number;
}): number {
  const room = Number(
    BigInt(input.savingsCents) * BigInt(input.savingsMultiple) - BigInt(input.loanBalanceCents),
  );
  return room > 0 ? room : 0;
}

/** Hidden when fewer than five members were due, so a small group cannot identify anyone. */
export function groupOnTimeLabel(cells: ContributionCell[]): string | null {
  const due = cells.filter((cell) => cell === "PAID" || cell === "LATE" || cell === "MISSED");
  if (due.length < 5) return null;
  const onTime = due.filter((cell) => cell === "PAID").length;
  return formatRateBps(Math.round((onTime * 10_000) / due.length));
}

export function statementShareText(input: {
  personName: string;
  chamaName: string;
  lines: { label: string; value: string }[];
}): string {
  return [input.personName, input.chamaName, ...input.lines.map((line) => `${line.label} ${line.value}`)].join("\n");
}
