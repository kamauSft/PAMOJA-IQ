import { prismaRaw } from "@/lib/db";
import { hashPin } from "@/lib/auth/pin";
import { normalizePhone } from "@/lib/phone";
import { appendAuditInTransaction } from "@/lib/audit/log";
import { umojaSettings, type ChamaSettings } from "@/lib/chama/rules";

export type CreateProfileResult =
  | { ok: true; phone: string; chamaName: string }
  | { ok: false; message: string };

function starterSettings(chamaName: string): ChamaSettings {
  return {
    ...umojaSettings,
    constitution: `${chamaName} uses the starting rules. Each active member contributes KES 2,000 by the 5th of the month. A late contribution is KES 200. A member may hold one loan, up to three times their savings. The treasurer can change these rules later.`,
  };
}

function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) return null;
  if (!/^[\p{L}\p{M}][\p{L}\p{M}\d .'-]*$/u.test(name)) return null;
  return name;
}

export async function createTreasurerProfile(raw: unknown): Promise<CreateProfileResult> {
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const name = cleanName(body.name);
  const chamaName = cleanName(body.chamaName);
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  const typedPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!name || !chamaName || !/^\d{4}$/.test(pin)) {
    return {
      ok: false,
      message: "Enter your name, a Kenyan mobile number, a 4-digit PIN, and the chama name.",
    };
  }
  const phone = normalizePhone(typedPhone);
  if (!phone) return { ok: false, message: "Enter a Kenyan mobile number, like 0712 000 111." };

  const existing = await prismaRaw.person.findUnique({ where: { phone } });
  if (existing) return { ok: false, message: "That number already has a profile. Sign in instead." };

  const hashedPin = await hashPin(pin);
  try {
    await prismaRaw.$transaction(async (tx) => {
      const chama = await tx.chama.create({
        data: {
          name: chamaName,
          currency: "KES",
          settings: starterSettings(chamaName),
          plan: "PRO",
          status: "TRIAL",
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      const person = await tx.person.create({
        data: {
          name,
          phone,
          preferredLanguage: "EN",
          channelPrefs: { whatsapp: true, sms: true, ussd: false },
          consent: {
            privacyNotice: true,
            whatsapp: true,
            sms: true,
            dataProcessing: true,
            consentedAt: new Date().toISOString(),
          },
        },
      });
      const membership = await tx.membership.create({
        data: {
          chamaId: chama.id,
          personId: person.id,
          role: "TREASURER",
          memberNo: "T001",
          joinDate: new Date(),
          status: "ACTIVE",
          hashedPin,
        },
      });
      await appendAuditInTransaction(tx, {
        chamaId: chama.id,
        membershipId: membership.id,
        personId: person.id,
        action: "chama.started",
        entityType: "Chama",
        entityId: chama.id,
        after: { name: chamaName, memberNo: "T001" },
      });
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { ok: false, message: "That number already has a profile. Sign in instead." };
    }
    throw error;
  }

  return { ok: true, phone: typedPhone, chamaName };
}
