import { appendAuditInTransaction } from "@/lib/audit/log";
import { prismaRaw } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { type MessagingProvider } from "@/lib/messaging/provider";
import { sendOwnerSms } from "@/lib/messaging/send-owner";

export async function notifyLock(personId: string, messaging?: MessagingProvider): Promise<void> {
  try {
    const person = await prismaRaw.person.findUnique({
      where: { id: personId },
      include: { memberships: { where: { status: "ACTIVE" } } },
    });
    if (!person || person.memberships.length === 0) return;

    const byChama = new Map<string, typeof person.memberships>();
    for (const membership of person.memberships) {
      const rows = byChama.get(membership.chamaId) ?? [];
      rows.push(membership);
      byChama.set(membership.chamaId, rows);
    }

    let earlier = 0;
    for (const [chamaId, rows] of byChama) {
      earlier += await prismaRaw.auditLog.count({
        where: { chamaId, action: "member.locked", entityId: person.id },
      });
      const actor = rows[0];
      await prismaRaw.$transaction(async (tx) => {
        await appendAuditInTransaction(tx, {
          chamaId,
          membershipId: actor.id,
          personId: person.id,
          action: "member.locked",
          entityType: "Person",
          entityId: person.id,
          after: { roles: rows.map((row) => row.role) },
        });
      });
    }

    const owner = normalizePhone(process.env.OWNER_PHONE ?? "");
    if (!owner) return;
    const memberDoor = person.memberships.some((row) => row.role === "MEMBER");
    const officialDoor = person.memberships.some((row) => row.role !== "MEMBER");
    const doors =
      memberDoor && officialDoor
        ? " The member door and the treasurer door are both locked."
        : memberDoor
          ? " The member door is locked."
          : " The treasurer door is locked.";
    const again = earlier > 0 ? " again" : "";
    const body = `Pamoja IQ: ${person.name} is locked${again} after 3 wrong PINs.${doors} Open the desk to unlock.`;
    if (messaging) {
      await messaging.sendSms({ to: owner, body });
      return;
    }
    await sendOwnerSms({ to: owner, body });
  } catch {
    // The lock stands even when the notice cannot be sent.
  }
}
