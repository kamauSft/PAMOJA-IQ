import { canBringInBooks, readSession } from "@/lib/chama/page-session";
import { publishPositions } from "@/lib/chama/publish";

export async function POST() {
  const session = await readSession();
  if (!session || !canBringInBooks(session.role)) {
    return Response.json({ message: "Not found." }, { status: 404 });
  }
  const result = await publishPositions({
    chamaId: session.chamaId,
    actor: { membershipId: session.membershipId, personId: session.personId, role: session.role },
  });
  return Response.json(result);
}
