import type { MembershipRole } from "@prisma/client";
import { getDb } from "@/lib/db";
import { currentTenant } from "@/lib/tenancy/context";

export interface SignInPerson {
  personId: string;
  name: string;
  locked: boolean;
  roles: { membershipId: string; memberNo: string; role: MembershipRole }[];
}

export async function loadSignInList(): Promise<SignInPerson[]> {
  const tenant = currentTenant();
  if (tenant?.role !== "TREASURER" && tenant?.role !== "CHAIR") return [];
  const rows = await getDb().membership.findMany({
    where: { status: "ACTIVE" },
    include: { person: { select: { id: true, name: true, lockedUntil: true } } },
    orderBy: { memberNo: "asc" },
  });
  const people = new Map<string, SignInPerson>();
  for (const row of rows) {
    const current = people.get(row.personId) ?? {
      personId: row.personId,
      name: row.person.name,
      locked: Boolean(row.person.lockedUntil),
      roles: [],
    };
    current.roles.push({ membershipId: row.id, memberNo: row.memberNo, role: row.role });
    people.set(row.personId, current);
  }
  return [...people.values()].sort((a, b) => a.name.localeCompare(b.name));
}
