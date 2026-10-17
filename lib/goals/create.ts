import { prismaRaw } from "@/lib/db";

export async function createSavingsGoal(input: {
  chamaId: string;
  membershipId: string;
  title: string;
  targetShillings: number;
  targetDate: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const title = input.title.trim().replace(/\s+/g, " ");
  if (title.length < 2 || title.length > 80) return { ok: false, message: "Give the goal a short name." };
  if (!Number.isInteger(input.targetShillings) || input.targetShillings <= 0 || input.targetShillings > 100_000_000) {
    return { ok: false, message: "Enter the target in whole shillings." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.targetDate)) return { ok: false, message: "Choose the date you want to arrive." };
  const target = new Date(`${input.targetDate}T00:00:00.000Z`);
  if (target.getTime() <= Date.now()) return { ok: false, message: "Choose a date in the future." };
  const existing = await prismaRaw.savingsGoal.count({
    where: { chamaId: input.chamaId, membershipId: input.membershipId },
  });
  if (existing >= 5) return { ok: false, message: "You can keep up to 5 goals." };
  await prismaRaw.savingsGoal.create({
    data: {
      chamaId: input.chamaId,
      membershipId: input.membershipId,
      title,
      targetCents: input.targetShillings * 100,
      targetDate: target,
    },
  });
  return { ok: true };
}

export async function updateSavingsGoal(input: {
  chamaId: string;
  membershipId: string;
  goalId: string;
  title: string;
  targetShillings: number;
  targetDate: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const title = input.title.trim().replace(/\s+/g, " ");
  if (title.length < 2 || title.length > 80) return { ok: false, message: "Give the goal a short name." };
  if (!Number.isInteger(input.targetShillings) || input.targetShillings <= 0 || input.targetShillings > 100_000_000) {
    return { ok: false, message: "Enter the target in whole shillings." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.targetDate)) return { ok: false, message: "Choose the date you want to arrive." };
  const target = new Date(`${input.targetDate}T00:00:00.000Z`);
  if (target.getTime() <= Date.now()) return { ok: false, message: "Choose a date in the future." };
  const goal = await prismaRaw.savingsGoal.findFirst({
    where: { id: input.goalId, chamaId: input.chamaId, membershipId: input.membershipId },
  });
  if (!goal) return { ok: false, message: "That goal was not found." };
  await prismaRaw.savingsGoal.update({
    where: { id: goal.id },
    data: { title, targetCents: input.targetShillings * 100, targetDate: target },
  });
  return { ok: true };
}
