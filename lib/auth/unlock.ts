import { randomInt } from "node:crypto";
import type { MembershipRole } from "@prisma/client";
import { appendAuditInTransaction } from "@/lib/audit/log";
import { verifyPin, hashPin } from "@/lib/auth/pin";
import { validatePin, pinLength } from "@/lib/auth/pin-policy";
import { prismaRaw } from "@/lib/db";

export type UnlockResult =
  | { ok: true; temporaryPin?: string }
  | { ok: false; message: string };

function freshPin(role: MembershipRole): string {
  const length = pinLength(role);
  const span = 10 ** length;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const pin = String(randomInt(0, span)).padStart(length, "0");
    if (!validatePin(pin, role)) return pin;
  }
  return role === "MEMBER" ? "482916" : "48291637";
}

export async function unlockAccount(input: {
  chamaId: string;
  actorMembershipId: string;
  actorPersonId: string;
  actorRole: MembershipRole;
  actorPin: string;
  targetMembershipId: string;
  mode: "unlock" | "temporary";
}): Promise<UnlockResult> {
  if (input.actorRole !== "TREASURER" && input.actorRole !== "CHAIR") {
    return { ok: false, message: "Only the treasurer or the chair can unlock a member." };
  }
  const actor = await prismaRaw.membership.findFirst({
    where: {
      id: input.actorMembershipId,
      chamaId: input.chamaId,
      personId: input.actorPersonId,
      role: input.actorRole,
      status: "ACTIVE",
    },
  });
  if (!actor || !(await verifyPin(input.actorPin, actor.hashedPin))) {
    return { ok: false, message: "The treasurer PIN was not accepted." };
  }
  const target = await prismaRaw.membership.findFirst({
    where: { id: input.targetMembershipId, chamaId: input.chamaId, status: "ACTIVE" },
  });
  if (!target) return { ok: false, message: "That member is not in this chama." };

  const temporaryPin = input.mode === "temporary" ? freshPin(target.role) : undefined;
  await prismaRaw.$transaction(async (tx) => {
    await tx.person.update({
      where: { id: target.personId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    if (temporaryPin) {
      await tx.membership.update({
        where: { id: target.id },
        data: { hashedPin: await hashPin(temporaryPin), mustChangePin: true },
      });
    }
    await appendAuditInTransaction(tx, {
      chamaId: input.chamaId,
      membershipId: actor.id,
      personId: input.actorPersonId,
      action: temporaryPin ? "member.temporary_pin" : "member.unlocked",
      entityType: "Membership",
      entityId: target.id,
      after: { memberNo: target.memberNo },
    });
  });
  return temporaryPin ? { ok: true, temporaryPin } : { ok: true };
}
