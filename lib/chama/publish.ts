import type { MembershipRole } from "@prisma/client";
import { appendAuditInTransaction } from "@/lib/audit/log";
import { prismaRaw } from "@/lib/db";
import { formatKes, memberSavings } from "@/lib/finance";
import { crossedMilestone } from "@/lib/motivation/engine";

const READY = "Your position is ready. Sign in to see it.";

export function accountUpdatedLine(beforeCents: number, afterCents: number): string | null {
  if (afterCents === beforeCents) return null;
  const delta = afterCents - beforeCents;
  const way = delta > 0 ? "up" : "down";
  return `Your account was updated. Savings: ${formatKes(afterCents)}, ${way} ${formatKes(Math.abs(delta))}.`;
}

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
    const members = await tx.membership.findMany({
      where: { chamaId: input.chamaId, status: "ACTIVE", role: "MEMBER" },
      include: { contributions: { select: { amountCents: true, publishedAt: true } } },
    });
    const pictures = members.map((member) => ({
      personId: member.personId,
      before: memberSavings(member.contributions.filter((row) => row.publishedAt != null)),
      after: memberSavings(member.contributions),
    }));
    await tx.contribution.updateMany({
      where: { chamaId: input.chamaId, publishedAt: null },
      data: { publishedAt: now },
    });
    for (const picture of pictures) {
      await tx.notification.create({
        data: {
          chamaId: input.chamaId,
          personId: picture.personId,
          title: "Your position is ready",
          body: READY,
        },
      });
      const highlight = accountUpdatedLine(picture.before, picture.after);
      if (highlight) {
        await tx.notification.create({
          data: {
            chamaId: input.chamaId,
            personId: picture.personId,
            title: "Your account was updated",
            body: highlight,
          },
        });
      }
      const milestone = crossedMilestone(picture.before, picture.after);
      if (milestone) {
        await tx.notification.create({
          data: {
            chamaId: input.chamaId,
            personId: picture.personId,
            title: "You reached a savings milestone",
            body: "Open Pamoja IQ to see it.",
          },
        });
      }
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
