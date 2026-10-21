import { phrasePosition } from "@/lib/ask/phrase";
import { loadAskFacts } from "@/lib/ask/facts";
import { booksAsOf } from "@/lib/chama/clock";
import { readSession, tenantFromSession } from "@/lib/chama/page-session";
import { getLocale } from "@/lib/locale";
import { runWithTenant } from "@/lib/tenancy/context";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return Response.json({ message: "Sign in first." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { question?: string } | null;
  const question = body?.question?.trim() ?? "";
  if (!question) return Response.json({ message: "Write a question first." }, { status: 400 });
  try {
    const locale = await getLocale();
    const facts = await runWithTenant(tenantFromSession(session), () =>
      loadAskFacts({
        membershipId: session.membershipId,
        role: session.role,
        locale,
        asOf: booksAsOf(),
      }),
    );
    const answer = await phrasePosition(question.slice(0, 400), facts);
    return Response.json({ answer });
  } catch {
    return Response.json({ message: "The answer could not be read. Try again." }, { status: 500 });
  }
}
