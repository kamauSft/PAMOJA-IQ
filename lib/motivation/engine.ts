import { encouragement, type EncouragementLocale } from "@/content/encouragement";
import {
  fillTemplate,
  motivationTemplates,
  type MotivationSituation,
  type MotivationVars,
} from "@/content/motivation-templates";
import { formatKes } from "@/lib/finance";
import { nairobiDay } from "@/lib/quotes/daily";

const MILESTONES_SHILLINGS = [1_000_000, 500_000, 250_000, 100_000, 50_000, 25_000, 10_000];

export type MotivationFacts = {
  membershipId: string;
  firstName: string;
  chamaName: string;
  locale: EncouragementLocale;
  asOf: Date;
  savingsCents: number;
  previousSavingsCents: number;
  monthsSaving: number;
  thisMonth: "PAID" | "LATE" | "MISSED" | "NOT_DUE";
  paidEarly: boolean;
  monthName: string;
  dueDate: string | null;
  daysUntilDue: number | null;
  streak: number;
  growthCents: number;
  finesCents: number;
  loanBalanceCents: number;
  loanPrincipalCents: number;
  loanClearedThisWeek: boolean;
  joinDate: Date;
  monthlyDueCents: number;
  goals: { title: string; percent: number; remainingCents: number }[];
  recentTemplateIds: string[];
};

export type MotivationChoice = {
  situation: MotivationSituation;
  templateId: string;
  message: string;
  proverb: string | null;
  push: string;
};

export function crossedMilestone(previousCents: number, savingsCents: number): number | null {
  for (const shillings of MILESTONES_SHILLINGS) {
    const cents = shillings * 100;
    if (previousCents < cents && savingsCents >= cents) return shillings;
  }
  return null;
}

export function chooseSituation(facts: MotivationFacts): MotivationSituation {
  const milestone = crossedMilestone(facts.previousSavingsCents, facts.savingsCents);
  const goal = bestGoal(facts.goals);
  const loanPercent = facts.loanPrincipalCents > 0 ? Math.round((1 - facts.loanBalanceCents / facts.loanPrincipalCents) * 100) : 0;
  if (facts.loanClearedThisWeek) return "loan_cleared";
  if (milestone) return "milestone";
  if (goal) return "goal";
  if (facts.paidEarly) return "paid_early";
  if (facts.streak >= 3) return "streak";
  if (facts.growthCents > 0) return "growth";
  if (facts.loanPrincipalCents > 0 && loanPercent >= 50 && facts.loanBalanceCents > 0) return "loan_half";
  if (facts.thisMonth !== "PAID" && facts.thisMonth !== "LATE" && facts.daysUntilDue !== null && facts.daysUntilDue >= 0 && facts.daysUntilDue <= 3) {
    return "due_soon";
  }
  if (facts.thisMonth === "MISSED") return "overdue";
  if (facts.finesCents > 0) return "fine";
  if (isAnniversary(facts.joinDate, facts.asOf)) return "anniversary";
  return "steady";
}

export function chooseMotivation(facts: MotivationFacts): MotivationChoice {
  const situation = chooseSituation(facts);
  const templates = motivationTemplates[situation];
  const template = pickTemplate(templates, facts.membershipId, facts.asOf, facts.recentTemplateIds);
  const vars = varsFrom(facts);
  const message = fillTemplate(template[facts.locale], vars);
  const proverb = proverbFor(facts.asOf, facts.locale);
  return {
    situation,
    templateId: template.id,
    message,
    proverb,
    push: motivationPush({
      firstName: facts.firstName,
      situation,
      message,
      proverb,
      showAmounts: false,
      locale: facts.locale,
    }),
  };
}

export function motivationPush(input: {
  firstName: string;
  situation: MotivationSituation;
  message: string;
  proverb: string | null;
  showAmounts: boolean;
  locale?: "en" | "sw";
}): string {
  if (input.showAmounts) return input.message;
  const sw = input.locale === "sw";
  if (input.situation === "loan_cleared") return sw ? "Mkopo umelipwa wote. Hongera." : "Your loan is fully repaid. Well done.";
  if (input.situation === "milestone") {
    return sw
      ? `Habari ya asubuhi, ${input.firstName}. Umefika hatua ya akiba. Fungua Pamoja IQ uione.`
      : `Good morning, ${input.firstName}. You reached a savings milestone. Open Pamoja IQ to see it.`;
  }
  if (input.situation === "steady" && input.proverb && !/\d|KES/.test(input.proverb)) return input.proverb;
  return sw
    ? `Habari ya asubuhi, ${input.firstName}. Fungua Pamoja IQ uone ujumbe wa leo.`
    : `Good morning, ${input.firstName}. Open Pamoja IQ to see today's note.`;
}

function bestGoal(goals: MotivationFacts["goals"]): MotivationFacts["goals"][number] | null {
  return goals.filter((goal) => goal.percent >= 25 && goal.remainingCents >= 0).sort((a, b) => b.percent - a.percent)[0] ?? null;
}

function pickTemplate<T extends { id: string }>(templates: T[], membershipId: string, asOf: Date, recentIds: string[]): T {
  const unused = templates.filter((template) => !recentIds.includes(template.id));
  const pool = unused.length > 0 ? unused : templates;
  const day = nairobiDay(asOf);
  const hash = [...`${membershipId}:${day}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return pool[hash % pool.length]!;
}

function varsFrom(facts: MotivationFacts): MotivationVars {
  const milestone = crossedMilestone(facts.previousSavingsCents, facts.savingsCents);
  const goal = bestGoal(facts.goals);
  const loanPercent = facts.loanPrincipalCents > 0 ? Math.round((1 - facts.loanBalanceCents / facts.loanPrincipalCents) * 100) : 0;
  return {
    firstName: facts.firstName,
    savings: plainAmount(facts.savingsCents),
    milestone: milestone ? String(milestone).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "",
    months: String(facts.monthsSaving),
    goalName: goal?.title ?? "",
    goalPercent: goal ? String(goal.percent) : "",
    amountLeft: goal ? plainAmount(goal.remainingCents) : "",
    streak: String(facts.streak),
    growth: plainAmount(facts.growthCents),
    loanPercent: String(loanPercent),
    loanLeft: plainAmount(facts.loanBalanceCents),
    amount: plainAmount(facts.monthlyDueCents),
    dueDate: facts.dueDate ?? "",
    fine: plainAmount(facts.finesCents),
    monthName: facts.monthName,
    chamaName: facts.chamaName,
  };
}

function plainAmount(cents: number): string {
  return formatKes(cents).replace(/^KES /, "");
}

function isAnniversary(joinDate: Date, asOf: Date): boolean {
  const years = asOf.getUTCFullYear() - joinDate.getUTCFullYear();
  return years >= 1 && joinDate.getUTCMonth() === asOf.getUTCMonth() && joinDate.getUTCDate() === asOf.getUTCDate();
}

function proverbFor(now: Date, locale: EncouragementLocale): string {
  const day = nairobiDay(now);
  const [year, month, date] = day.split("-").map(Number);
  const index = Math.floor(Date.UTC(year!, month! - 1, date!) / 86_400_000) % encouragement.en.length;
  const safe = index < 0 ? index + encouragement.en.length : index;
  return encouragement[locale][safe] ?? encouragement.en[0]!;
}

export function nairobiHour(now: Date): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return Number(hour);
}

/** One motivation alert a day. A milestone may add a second. Nothing between 20:00 and 07:00 Nairobi. */
export function allowPush(input: {
  now: Date;
  motivationSentToday: number;
  pushesSentToday: number;
  kind: "motivation" | "milestone";
}): boolean {
  const hour = nairobiHour(input.now);
  if (hour >= 20 || hour < 7) return false;
  if (input.pushesSentToday >= 2) return false;
  if (input.kind === "motivation" && input.motivationSentToday >= 1) return false;
  return true;
}
