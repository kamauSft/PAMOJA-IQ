import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, type ActiveSession } from "../auth/service";
import { SESSION_COOKIE } from "../auth/session";
import { isOfficial, type TenantContext } from "../tenancy/context";

export async function readSession(): Promise<ActiveSession | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return token ? getSession(token) : null;
}

export async function requireSession(): Promise<ActiveSession> {
  const session = await readSession();
  if (!session) redirect("/");
  return session;
}

export function canBringInBooks(role: ActiveSession["role"]): boolean {
  return role === "TREASURER" || role === "CHAIR";
}

export function tenantFromSession(session: ActiveSession): TenantContext {
  return {
    chamaId: session.chamaId,
    membershipId: session.membershipId,
    personId: session.personId,
    role: session.role,
  };
}

export function homeForRole(role: ActiveSession["role"]): string {
  return isOfficial(role) ? "/desk" : "/home";
}
