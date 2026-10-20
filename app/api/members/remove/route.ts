import { readSession } from "@/lib/chama/page-session";
import { removeMember } from "@/lib/auth/unlock";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session || (session.role !== "TREASURER" && session.role !== "CHAIR")) {
    return Response.json({ message: "Not found." }, { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as { personId?: string; pin?: string } | null;
  const result = await removeMember({
    chamaId: session.chamaId,
    actor: { membershipId: session.membershipId, personId: session.personId, role: session.role },
    personId: body?.personId ?? "",
    pin: body?.pin ?? "",
  });
  if (!result.ok) return Response.json({ message: result.message }, { status: 400 });
  return Response.json(result);
}
