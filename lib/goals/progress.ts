export type GoalPace = "reached" | "on_track" | "slightly_behind" | "behind";

export function goalProgress(input: {
  savedCents: number;
  targetCents: number;
  startedAt: Date;
  targetDate: Date;
  asOf: Date;
}): { pace: GoalPace; percent: number; remainingCents: number } {
  const target = Math.max(input.targetCents, 0);
  const saved = Math.max(input.savedCents, 0);
  const remainingCents = Math.max(target - saved, 0);
  const percent = target === 0 ? 100 : Math.min(100, Math.round((saved * 100) / target));
  if (target > 0 && saved >= target) return { pace: "reached", percent: 100, remainingCents: 0 };
  const span = input.targetDate.getTime() - input.startedAt.getTime();
  const elapsed = span <= 0 ? 1 : Math.min(1, Math.max(0, (input.asOf.getTime() - input.startedAt.getTime()) / span));
  const expected = Math.round(target * elapsed);
  if (saved >= expected) return { pace: "on_track", percent, remainingCents };
  if (expected > 0 && saved * 4 >= expected * 3) return { pace: "slightly_behind", percent, remainingCents };
  return { pace: "behind", percent, remainingCents };
}
