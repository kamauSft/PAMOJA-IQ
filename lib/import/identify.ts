export interface KnownMember {
  personId: string;
  name: string;
  phone: string;
  memberNo: string;
  role: string;
  status: string;
}

export type PaymentPlacement = "register" | "new" | "name" | "ambiguous" | "left";

export interface Placement {
  placement: PaymentPlacement;
  placedName: string | null;
  placedNo: string | null;
}

export function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

/** Two names are the same person when one name's words all sit inside the other. A single word is not enough. */
export function samePerson(left: string, right: string): boolean {
  const a = nameTokens(left);
  const b = nameTokens(right);
  if (a.length === 0 || b.length === 0) return false;
  if (a.join(" ") === b.join(" ")) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = new Set(a.length <= b.length ? b : a);
  if (shorter.length < 2) return false;
  return shorter.every((token) => longer.has(token));
}

function prefer<T extends KnownMember>(rows: T[]): T | undefined {
  return (
    rows.find((row) => row.status === "ACTIVE" && row.role === "MEMBER") ??
    rows.find((row) => row.status === "ACTIVE") ??
    rows[0]
  );
}

export function placementFor(
  payment: { name: string; phone: string | null; memberNo: string | null },
  known: KnownMember[],
): Placement {
  const active = known.filter((member) => member.status === "ACTIVE");
  if (payment.phone) {
    const hits = active.filter((member) => member.phone === payment.phone);
    const chosen = prefer(hits);
    if (chosen) return { placement: "register", placedName: chosen.name, placedNo: chosen.memberNo };
    return { placement: "new", placedName: null, placedNo: null };
  }
  if (payment.memberNo) {
    const chosen = prefer(active.filter((member) => member.memberNo === payment.memberNo));
    if (chosen) return { placement: "register", placedName: chosen.name, placedNo: chosen.memberNo };
  }
  const name = payment.name.trim();
  if (name) {
    const hits = active.filter((member) => samePerson(name, member.name));
    const people = new Set(hits.map((member) => member.personId));
    if (people.size > 1) return { placement: "ambiguous", placedName: null, placedNo: null };
    if (people.size === 1) {
      const chosen = prefer(hits);
      if (chosen) return { placement: "name", placedName: chosen.name, placedNo: chosen.memberNo };
    }
  }
  return { placement: "left", placedName: null, placedNo: null };
}
