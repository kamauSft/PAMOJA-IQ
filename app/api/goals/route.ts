import { readSession } from "@/lib/chama/page-session";
import { createSavingsGoal, updateSavingsGoal } from "@/lib/goals/create";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return Response.json({ message: "Not found." }, { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as {
    title?: string;
    targetShillings?: number;
    targetDate?: string;
  } | null;
  const result = await createSavingsGoal({
    chamaId: session.chamaId,
    membershipId: session.membershipId,
    title: body?.title ?? "",
    targetShillings: Number(body?.targetShillings),
    targetDate: body?.targetDate ?? "",
  });
  if (!result.ok) return Response.json({ message: result.message }, { status: 400 });
  return Response.json({ ok: true });
}

export async function PATCH(request: Request) {
  const session = await readSession();
  if (!session) {
    return Response.json({ message: "Not found." }, { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as {
    id?: string;
    title?: string;
    targetShillings?: number;
    targetDate?: string;
  } | null;
  const result = await updateSavingsGoal({
    chamaId: session.chamaId,
    membershipId: session.membershipId,
    goalId: body?.id ?? "",
    title: body?.title ?? "",
    targetShillings: Number(body?.targetShillings),
    targetDate: body?.targetDate ?? "",
  });
  if (!result.ok) {
    return Response.json({ message: result.message }, { status: result.message === "That goal was not found." ? 404 : 400 });
  }
  return Response.json({ ok: true });
}
