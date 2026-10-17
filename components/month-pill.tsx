import type { ContributionCell } from "@/lib/chama/picture";

const TONE: Record<ContributionCell, string> = {
  PAID: "bg-accent/10 text-accent",
  LATE: "bg-due/10 text-due",
  MISSED: "bg-overdue/10 text-overdue",
  NOT_DUE: "bg-line text-muted",
};

const WORD: Record<ContributionCell, string> = {
  PAID: "Paid",
  LATE: "Late",
  MISSED: "Missed",
  NOT_DUE: "Not due",
};

export function MonthPill({ cell, label }: { cell: ContributionCell; label?: string }) {
  return (
    <span className={`inline-block rounded-md px-2 py-1 text-[13px] font-semibold ${TONE[cell]}`}>
      {label ?? WORD[cell]}
    </span>
  );
}

export function monthWord(cell: ContributionCell): string {
  return WORD[cell];
}
