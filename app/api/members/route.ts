import { canBringInBooks, readSession } from "@/lib/chama/page-session";
import { addMember } from "@/lib/chama/add-member";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session || !canBringInBooks(session.role)) {
    return Response.json({ message: "Not found." }, { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as { name?: string; phone?: string } | null;
  const result = await addMember({
    chamaId: session.chamaId,
    actor: { membershipId: session.membershipId, personId: session.personId, role: session.role },
    name: body?.name ?? "",
    phone: body?.phone ?? "",
  });
  if (!result.ok) return Response.json({ message: result.message }, { status: 400 });
  return Response.json(result);
}
