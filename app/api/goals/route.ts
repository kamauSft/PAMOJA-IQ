import { readSession } from "@/lib/chama/page-session";
import { createSavingsGoal } from "@/lib/goals/create";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session || session.role !== "MEMBER") {
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
