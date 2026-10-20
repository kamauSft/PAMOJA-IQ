import type { MembershipRole } from "@prisma/client";
import { appendAuditInTransaction } from "@/lib/audit/log";
import { prismaRaw } from "@/lib/db";
import { verifyPin } from "./pin";

export async function unlockAccount(input: {
  chamaId: string;
  actor: { membershipId: string; personId: string; role: MembershipRole };
  personId: string;
  pin: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (input.actor.role !== "TREASURER" && input.actor.role !== "CHAIR") {
    return { ok: false, message: "Only the treasurer or the chair can unlock a number." };
  }
  const actor = await prismaRaw.membership.findFirst({
    where: {
      id: input.actor.membershipId,
      chamaId: input.chamaId,
      personId: input.actor.personId,
      status: "ACTIVE",
    },
  });
  if (!actor || (actor.role !== "TREASURER" && actor.role !== "CHAIR")) {
    return { ok: false, message: "Only the treasurer or the chair can unlock a number." };
  }
  if (!(await verifyPin(input.pin.trim(), actor.hashedPin))) {
    return { ok: false, message: "That PIN does not match this treasurer or chair." };
  }
  const member = await prismaRaw.membership.findFirst({
    where: { chamaId: input.chamaId, personId: input.personId, status: "ACTIVE" },
  });
  if (!member) return { ok: false, message: "That member is not in this chama." };

  await prismaRaw.$transaction(async (tx) => {
    await tx.person.update({
      where: { id: input.personId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    await appendAuditInTransaction(tx, {
      chamaId: input.chamaId,
      membershipId: actor.id,
      personId: input.actor.personId,
      action: "member.unlocked",
      entityType: "Person",
      entityId: input.personId,
      after: { memberNo: member.memberNo },
    });
  });
  return { ok: true };
}
