import type { ContributionCell } from "@/lib/chama/picture";

const TONE: Record<ContributionCell, string> = {
  PAID: "bg-[#1e6f5c] text-white",
  LATE: "bg-[#9a6b00] text-white",
  MISSED: "bg-[#a33a2b] text-white",
  NOT_DUE: "bg-line text-ink",
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
