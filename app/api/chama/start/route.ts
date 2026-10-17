import { limitAuth } from "@/lib/auth/http";
import { createTreasurerProfile } from "@/lib/chama/create-profile";

export async function POST(request: Request) {
  const limit = limitAuth(request, "start");
  if (!limit.ok) {
    return Response.json({ message: "Too many tries. Wait 15 minutes and try again." }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const result = await createTreasurerProfile(body);
  if (!result.ok) return Response.json({ message: result.message }, { status: 400 });
  return Response.json({ phone: result.phone, chamaName: result.chamaName });
}
