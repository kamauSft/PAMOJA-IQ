import type { MembershipRole } from "@prisma/client";
import { appendAuditInTransaction } from "@/lib/audit/log";
import { prismaRaw } from "@/lib/db";
import { hashPin, verifyPin } from "./pin";
import { randomMemberPin, randomOfficialPin } from "./pin-policy";

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

export async function issueTemporaryPin(input: {
  chamaId: string;
  actor: { membershipId: string; personId: string; role: MembershipRole };
  membershipId: string;
  pin: string;
}): Promise<
  | { ok: true; name: string; pins: { role: MembershipRole; memberNo: string; temporaryPin: string }[] }
  | { ok: false; message: string }
> {
  if (input.actor.role !== "TREASURER" && input.actor.role !== "CHAIR") {
    return { ok: false, message: "Only the treasurer or the chair can set a PIN." };
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
    return { ok: false, message: "Only the treasurer or the chair can set a PIN." };
  }
  if (!(await verifyPin(input.pin.trim(), actor.hashedPin))) {
    return { ok: false, message: "That PIN does not match this treasurer or chair." };
  }
  const membership = await prismaRaw.membership.findFirst({
    where: { id: input.membershipId, chamaId: input.chamaId, status: "ACTIVE" },
    include: { person: true },
  });
  if (!membership) return { ok: false, message: "That member is not in this chama." };
  const posts = await prismaRaw.membership.findMany({
    where: { chamaId: input.chamaId, personId: membership.personId, status: "ACTIVE" },
    orderBy: { memberNo: "asc" },
  });
  const pins = await Promise.all(
    posts.map(async (post) => ({
      role: post.role,
      memberNo: post.memberNo,
      temporaryPin: post.role === "MEMBER" ? randomMemberPin() : randomOfficialPin(),
      hashedPin: "",
    })),
  );
  for (const row of pins) row.hashedPin = await hashPin(row.temporaryPin);
  await prismaRaw.$transaction(async (tx) => {
    for (const row of pins) {
      const post = posts.find((item) => item.memberNo === row.memberNo && item.role === row.role);
      if (!post) continue;
      await tx.membership.update({ where: { id: post.id }, data: { hashedPin: row.hashedPin } });
    }
    await tx.person.update({
      where: { id: membership.personId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    await tx.session.updateMany({
      where: { personId: membership.personId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await appendAuditInTransaction(tx, {
      chamaId: input.chamaId,
      membershipId: actor.id,
      personId: input.actor.personId,
      action: "member.pin_reset",
      entityType: "Person",
      entityId: membership.personId,
      after: { name: membership.person.name, roles: posts.map((post) => post.role) },
    });
  });
  return {
    ok: true,
    name: membership.person.name,
    pins: pins.map(({ role, memberNo, temporaryPin }) => ({ role, memberNo, temporaryPin })),
  };
}

const HOLD_UNTIL = new Date("9999-12-31T00:00:00.000Z");

async function actingOfficer(input: {
  chamaId: string;
  actor: { membershipId: string; personId: string; role: MembershipRole };
  pin: string;
  refused: string;
}) {
  if (input.actor.role !== "TREASURER" && input.actor.role !== "CHAIR") {
    return { ok: false as const, message: input.refused };
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
    return { ok: false as const, message: input.refused };
  }
  if (!(await verifyPin(input.pin.trim(), actor.hashedPin))) {
    return { ok: false as const, message: "That PIN does not match this treasurer or chair." };
  }
  return { ok: true as const, actor };
}

export async function lockAccount(input: {
  chamaId: string;
  actor: { membershipId: string; personId: string; role: MembershipRole };
  personId: string;
  pin: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const officer = await actingOfficer({
    ...input,
    refused: "Only the treasurer or the chair can lock a number.",
  });
  if (!officer.ok) return officer;
  if (input.personId === input.actor.personId) {
    return { ok: false, message: "You cannot lock your own number." };
  }
  const member = await prismaRaw.membership.findFirst({
    where: { chamaId: input.chamaId, personId: input.personId, status: "ACTIVE" },
  });
  if (!member) return { ok: false, message: "That member is not in this chama." };
  await prismaRaw.$transaction(async (tx) => {
    await tx.person.update({
      where: { id: input.personId },
      data: { lockedUntil: HOLD_UNTIL },
    });
    await tx.session.updateMany({
      where: { personId: input.personId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await appendAuditInTransaction(tx, {
      chamaId: input.chamaId,
      membershipId: officer.actor.id,
      personId: input.actor.personId,
      action: "member.held",
      entityType: "Person",
      entityId: input.personId,
      after: { memberNo: member.memberNo },
    });
  });
  return { ok: true };
}

export async function removeMember(input: {
  chamaId: string;
  actor: { membershipId: string; personId: string; role: MembershipRole };
  personId: string;
  pin: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const officer = await actingOfficer({
    ...input,
    refused: "Only the treasurer or the chair can remove a person.",
  });
  if (!officer.ok) return officer;
  if (input.personId === input.actor.personId) {
    return { ok: false, message: "You cannot remove your own number." };
  }
  const posts = await prismaRaw.membership.findMany({
    where: { chamaId: input.chamaId, personId: input.personId, status: "ACTIVE" },
  });
  if (posts.length === 0) return { ok: false, message: "That member is not in this chama." };
  const now = new Date();
  await prismaRaw.$transaction(async (tx) => {
    await tx.membership.updateMany({
      where: { id: { in: posts.map((post) => post.id) } },
      data: { status: "EXITED", exitDate: now },
    });
    await tx.session.updateMany({
      where: { personId: input.personId, revokedAt: null },
      data: { revokedAt: now },
    });
    await appendAuditInTransaction(tx, {
      chamaId: input.chamaId,
      membershipId: officer.actor.id,
      personId: input.actor.personId,
      action: "member.removed",
      entityType: "Person",
      entityId: input.personId,
      after: { memberNos: posts.map((post) => post.memberNo) },
    });
  });
  return { ok: true };
}
