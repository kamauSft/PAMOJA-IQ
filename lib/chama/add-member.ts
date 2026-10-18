import { randomInt } from "node:crypto";
import type { MembershipRole } from "@prisma/client";
import { appendAuditInTransaction } from "@/lib/audit/log";
import { hashPin } from "@/lib/auth/pin";
import { validatePin } from "@/lib/auth/pin-policy";
import { prismaRaw } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

export type AddMemberResult =
  | { ok: true; memberNo: string; phone: string; name: string; temporaryPin: string }
  | { ok: false; message: string };

function cleanName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) return null;
  if (!/^[\p{L}\p{M}][\p{L}\p{M}\d .'-]*$/u.test(name)) return null;
  return name;
}

function nextMemberNo(used: Set<string>): string {
  let number = 1;
  while (used.has(`M${String(number).padStart(3, "0")}`)) number += 1;
  return `M${String(number).padStart(3, "0")}`;
}

export async function addMember(input: {
  chamaId: string;
  actor: { membershipId: string; personId: string; role: MembershipRole };
  name: string;
  phone: string;
}): Promise<AddMemberResult> {
  if (input.actor.role !== "TREASURER" && input.actor.role !== "CHAIR") {
    return { ok: false, message: "Only the treasurer can add a member." };
  }
  const name = cleanName(input.name);
  if (!name) return { ok: false, message: "Enter the member's full name." };
  const phone = normalizePhone(input.phone.trim());
  if (!phone) return { ok: false, message: "Enter a Kenyan mobile number, like 0712 000 111." };

  const actor = await prismaRaw.membership.findFirst({
    where: { id: input.actor.membershipId, chamaId: input.chamaId, personId: input.actor.personId, status: "ACTIVE" },
  });
  if (!actor || (actor.role !== "TREASURER" && actor.role !== "CHAIR")) {
    return { ok: false, message: "Only the treasurer can add a member." };
  }

  const taken = await prismaRaw.person.findUnique({ where: { phone } });
  if (taken) return { ok: false, message: "That number is already registered. Ask them to sign in." };

  const numbers = await prismaRaw.membership.findMany({
    where: { chamaId: input.chamaId },
    select: { memberNo: true },
  });
  const memberNo = nextMemberNo(new Set(numbers.map((row) => row.memberNo)));
  let temporaryPin = "";
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const candidate = String(randomInt(0, 1_000_000)).padStart(6, "0");
    if (!validatePin(candidate, "MEMBER")) {
      temporaryPin = candidate;
      break;
    }
  }
  if (!temporaryPin) temporaryPin = "482916";
  const hashedPin = await hashPin(temporaryPin);

  await prismaRaw.$transaction(async (tx) => {
    const person = await tx.person.create({
      data: {
        name,
        phone,
        preferredLanguage: "EN",
        channelPrefs: { whatsapp: true, sms: true, ussd: false },
        consent: { privacyNotice: true, dataProcessing: true, consentedAt: new Date().toISOString() },
      },
    });
    const membership = await tx.membership.create({
      data: {
        chamaId: input.chamaId,
        personId: person.id,
        role: "MEMBER",
        memberNo,
        joinDate: new Date(),
        status: "ACTIVE",
        hashedPin,
        mustChangePin: true,
      },
    });
    await appendAuditInTransaction(tx, {
      chamaId: input.chamaId,
      membershipId: actor.id,
      personId: input.actor.personId,
      action: "member.added",
      entityType: "Membership",
      entityId: membership.id,
      after: { memberNo, name },
    });
  });

  return { ok: true, memberNo, phone, name, temporaryPin };
}
