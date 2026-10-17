import type { MembershipRole } from "@prisma/client";
import { appendAuditInTransaction } from "@/lib/audit/log";
import { prismaRaw } from "@/lib/db";
import { formatKes, memberSavings } from "@/lib/finance";

const READY = "Your position is ready. Sign in to see it.";

export async function loadPositions(chamaId: string) {
  const memberships = await prismaRaw.membership.findMany({
    where: { chamaId, status: "ACTIVE" },
    include: { person: true, contributions: true },
    orderBy: { memberNo: "asc" },
  });
  const waiting = memberships.reduce(
    (count, membership) => count + membership.contributions.filter((row) => row.publishedAt == null).length,
    0,
  );
  return {
    waiting,
    members: memberships.map((membership) => {
      const shared = membership.contributions.filter((row) => row.publishedAt != null);
      const after = memberSavings(membership.contributions);
      const now = memberSavings(shared);
      return {
        memberNo: membership.memberNo,
        name: membership.person.name,
        nowLabel: formatKes(now),
        afterLabel: formatKes(after),
        changed: after !== now,
      };
    }),
  };
}

export async function publishPositions(input: {
  chamaId: string;
  actor: { membershipId: string; personId: string; role: MembershipRole };
}): Promise<{ published: number; members: number }> {
  return prismaRaw.$transaction(async (tx) => {
    const waiting = await tx.contribution.count({ where: { chamaId: input.chamaId, publishedAt: null } });
    if (waiting === 0) return { published: 0, members: 0 };
    const now = new Date();
    await tx.contribution.updateMany({
      where: { chamaId: input.chamaId, publishedAt: null },
      data: { publishedAt: now },
    });
    const members = await tx.membership.findMany({
      where: { chamaId: input.chamaId, status: "ACTIVE", role: "MEMBER" },
    });
    for (const member of members) {
      await tx.notification.create({
        data: {
          chamaId: input.chamaId,
          personId: member.personId,
          title: "Your position is ready",
          body: READY,
        },
      });
    }
    await appendAuditInTransaction(tx, {
      chamaId: input.chamaId,
      membershipId: input.actor.membershipId,
      personId: input.actor.personId,
      action: "books.published",
      entityType: "Chama",
      entityId: input.chamaId,
      after: { payments: waiting, members: members.length },
    });
    return { published: waiting, members: members.length };
  });
}

export function publishNotice(): string {
  return READY;
}
