import { readSession } from "@/lib/chama/page-session";
import { issueTemporaryPin } from "@/lib/auth/unlock";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session || (session.role !== "TREASURER" && session.role !== "CHAIR")) {
    return Response.json({ message: "Not found." }, { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as { membershipId?: string; pin?: string } | null;
  const result = await issueTemporaryPin({
    chamaId: session.chamaId,
    actor: { membershipId: session.membershipId, personId: session.personId, role: session.role },
    membershipId: body?.membershipId ?? "",
    pin: body?.pin ?? "",
  });
  if (!result.ok) return Response.json({ message: result.message }, { status: 400 });
  return Response.json(result);
}
