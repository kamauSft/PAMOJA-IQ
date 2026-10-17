import { encouragement, type EncouragementLocale } from "@/content/encouragement";
import { formatKes } from "@/lib/finance";

export function nairobiDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function quoteForDay(now = new Date(), locale: EncouragementLocale = "en"): { day: string; text: string } {
  const day = nairobiDay(now);
  const [year, month, date] = day.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, date);
  const index = Math.floor(utc / 86_400_000) % encouragement.en.length;
  const safe = index < 0 ? index + encouragement.en.length : index;
  return { day, text: encouragement[locale][safe] };
}

export function personalLine(input: {
  locale: EncouragementLocale;
  thisMonth: "PAID" | "LATE" | "MISSED" | "NOT_DUE";
  goalTitle?: string;
  remainingCents?: number;
}): string {
  const close = input.goalTitle && input.remainingCents !== undefined && input.remainingCents > 0 && input.remainingCents <= 500_000;
  if (close && input.goalTitle) {
    const left = formatKes(input.remainingCents ?? 0);
    return input.locale === "sw"
      ? `Umebaki ${left} kufikia "${input.goalTitle}".`
      : `Only ${left} to go on "${input.goalTitle}".`;
  }
  if (input.thisMonth === "PAID" || input.thisMonth === "LATE") {
    return input.locale === "sw" ? "Mwezi huu upo kwenye daftari. Endelea." : "This month is in the books. Keep going.";
  }
  if (input.thisMonth === "MISSED") {
    return input.locale === "sw"
      ? "Mwezi mpya ni mwanzo mpya. Hata malipo madogo yanahesabiwa."
      : "A new month is a fresh start. Even a small payment counts.";
  }
  return input.locale === "sw" ? "Malipo yako bado hayajatimia. Ukiona nafasi, yafanye mapema." : "Your month is not due yet. When it is, pay it early.";
}

export function memberReminders(input: {
  locale: EncouragementLocale;
  periodLabel: string;
  thisMonth: "PAID" | "LATE" | "MISSED" | "NOT_DUE";
  monthlyDueLabel: string;
  loan?: { remainingLabel: string; dueDate: string } | null;
}): string[] {
  const lines: string[] = [];
  const sw = input.locale === "sw";
  if (input.thisMonth === "MISSED") {
    lines.push(
      sw
        ? `Mchango wako wa ${input.periodLabel} wa ${input.monthlyDueLabel} umechelewa. Lipa mweka hazina.`
        : `Your ${input.periodLabel} contribution of ${input.monthlyDueLabel} is overdue. Please pay your treasurer.`,
    );
  } else if (input.thisMonth === "PAID" || input.thisMonth === "LATE") {
    lines.push(
      sw
        ? `Mchango wako wa ${input.periodLabel} uko kwenye daftari.`
        : `Your ${input.periodLabel} contribution is in the books.`,
    );
  } else {
    lines.push(
      sw
        ? `Mchango wako wa ${input.periodLabel} wa ${input.monthlyDueLabel} bado haujatakiwa. Ukiona nafasi, ulipe mapema.`
        : `Your ${input.periodLabel} contribution of ${input.monthlyDueLabel} is not due yet. Pay it early.`,
    );
  }
  if (input.loan) {
    lines.push(
      sw
        ? `Malipo ya mkopo ya ${input.loan.remainingLabel} yanatakiwa tarehe ${input.loan.dueDate}.`
        : `Loan instalment of ${input.loan.remainingLabel} is due on ${input.loan.dueDate}.`,
    );
  }
  return lines;
}
