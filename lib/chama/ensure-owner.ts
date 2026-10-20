import { hashPin } from "@/lib/auth/pin";
import { prismaRaw } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

const MEMBER_PERIODS = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];

function nextNo(taken: Set<string>, prefix: "M" | "T"): string {
  let number = 1;
  while (taken.has(`${prefix}${String(number).padStart(3, "0")}`)) number += 1;
  return `${prefix}${String(number).padStart(3, "0")}`;
}

export async function ensureOwnerAccount(input: {
  phone: string;
  name: string;
  pin: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2) return { ok: false, message: "OWNER_NAME is missing." };
  const phone = normalizePhone(input.phone.trim());
  if (!phone) return { ok: false, message: "OWNER_PHONE is not a Kenyan mobile number." };

  const chama = await prismaRaw.chama.findFirst({ orderBy: { createdAt: "asc" } });
  if (!chama) return { ok: false, message: "No chama is saved yet." };

  const hashedPin = await hashPin(input.pin);
  const existing = await prismaRaw.person.findUnique({ where: { phone } });
  const person = existing
    ? await prismaRaw.person.update({
        where: { id: existing.id },
        data: { name, failedLoginAttempts: 0, lockedUntil: null },
      })
    : await prismaRaw.person.create({
        data: {
          name,
          phone,
          preferredLanguage: "EN",
          channelPrefs: { whatsapp: true, sms: true, ussd: false },
          consent: { privacyNotice: true, dataProcessing: true, consentedAt: new Date().toISOString() },
        },
      });

  const taken = new Set(
    (await prismaRaw.membership.findMany({ where: { chamaId: chama.id }, select: { memberNo: true } })).map(
      (row) => row.memberNo,
    ),
  );

  let member = await prismaRaw.membership.findFirst({
    where: { chamaId: chama.id, personId: person.id, role: "MEMBER" },
  });
  if (!member) {
    const memberNo = nextNo(taken, "M");
    taken.add(memberNo);
    member = await prismaRaw.membership.create({
      data: {
        chamaId: chama.id,
        personId: person.id,
        role: "MEMBER",
        memberNo,
        joinDate: new Date("2025-05-01T00:00:00.000Z"),
        status: "ACTIVE",
        hashedPin,
      },
    });
    for (const period of MEMBER_PERIODS) {
      const [year, month] = period.split("-").map(Number);
      const datePaid = new Date(Date.UTC(year, month - 1, 2));
      await prismaRaw.contribution.create({
        data: {
          chamaId: chama.id,
          membershipId: member.id,
          amountCents: 200_000,
          period,
          datePaid,
          method: "CASH",
          reference: `OWNER-${period}`,
          source: "IMPORT",
          publishedAt: datePaid,
        },
      });
    }
    await prismaRaw.savingsGoal.create({
      data: {
        chamaId: chama.id,
        membershipId: member.id,
        title: "School fees",
        targetCents: 8_000_000,
        targetDate: new Date("2027-01-31T00:00:00.000Z"),
      },
    });
  } else {
    await prismaRaw.membership.update({
      where: { id: member.id },
      data: { hashedPin, status: "ACTIVE", exitDate: null },
    });
  }

  const treasurer = await prismaRaw.membership.findFirst({
    where: { chamaId: chama.id, personId: person.id, role: "TREASURER" },
  });
  if (!treasurer) {
    await prismaRaw.membership.create({
      data: {
        chamaId: chama.id,
        personId: person.id,
        role: "TREASURER",
        memberNo: nextNo(taken, "T"),
        joinDate: new Date("2026-10-17T00:00:00.000Z"),
        status: "ACTIVE",
        hashedPin,
      },
    });
  } else {
    await prismaRaw.membership.update({
      where: { id: treasurer.id },
      data: { hashedPin, status: "ACTIVE", exitDate: null },
    });
  }

  return { ok: true };
}
