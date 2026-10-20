import { randomInt } from "node:crypto";
import type { MembershipRole } from "@prisma/client";
import { appendAuditInTransaction } from "@/lib/audit/log";
import { importFileLabel } from "@/lib/chama/import-label";
import { hashPin } from "@/lib/auth/pin";
import { prismaRaw } from "@/lib/db";
import type { WorkbookRead } from "./workbook";

export interface ImportSaveResult {
  membersAdded: number;
  membersAlready: number;
  contributionsAdded: number;
  contributionsUpdated: number;
  contributionsSkipped: number;
  problems: string[];
}

function nextMemberNo(used: Set<string>): string {
  let number = 1;
  while (used.has(`M${String(number).padStart(3, "0")}`)) number += 1;
  const memberNo = `M${String(number).padStart(3, "0")}`;
  used.add(memberNo);
  return memberNo;
}

function note(problems: string[], message: string) {
  if (problems.length < 50) problems.push(message);
}

export async function saveImport(input: {
  chamaId: string;
  actor: { membershipId: string; personId: string; role: MembershipRole };
  workbook: WorkbookRead;
  fileName?: string;
}): Promise<ImportSaveResult> {
  const problems = [...input.workbook.problems];
  const ready = input.workbook.members.filter((member) => {
    if (member.status === "EXITED") {
      note(problems, `${member.name} is marked as left, so they were not added.`);
      return false;
    }
    if (!member.phone) {
      note(problems, `${member.sheet} row ${member.row}: ${member.name} needs a phone number.`);
      return false;
    }
    return true;
  });

  const existingMemberships = await prismaRaw.membership.findMany({
    where: { chamaId: input.chamaId },
    include: { person: true },
  });
  const byPhone = new Map(existingMemberships.map((membership) => [membership.person.phone, membership]));
  const usedNumbers = new Set(existingMemberships.map((membership) => membership.memberNo));
  const fresh = ready.filter((member) => !byPhone.has(member.phone));
  const pinByPhone = new Map<string, string>();
  for (const member of fresh) {
    pinByPhone.set(member.phone, await hashPin(String(randomInt(0, 10000)).padStart(4, "0")));
  }

  return prismaRaw.$transaction(async (tx) => {
    let membersAdded = 0;
    let membersAlready = 0;
    const membershipByPhone = new Map(byPhone);
    const membershipByNo = new Map(existingMemberships.map((membership) => [membership.memberNo, membership]));

    for (const member of ready) {
      const found = membershipByPhone.get(member.phone);
      if (found) {
        membersAlready += 1;
        continue;
      }
      const person =
        (await tx.person.findUnique({ where: { phone: member.phone } })) ??
        (await tx.person.create({
          data: {
            name: member.name,
            phone: member.phone,
            channelPrefs: { whatsapp: true, sms: true, ussd: false },
            consent: { privacyNotice: true, dataProcessing: true, consentedAt: new Date().toISOString() },
          },
        }));
      const memberNo = member.memberNo && !usedNumbers.has(member.memberNo) ? member.memberNo : nextMemberNo(usedNumbers);
      if (member.memberNo && memberNo !== member.memberNo) {
        note(problems, `${member.name} was numbered ${memberNo} because ${member.memberNo} is already used.`);
      }
      usedNumbers.add(memberNo);
      if (member.role !== "MEMBER") {
        note(problems, `${member.name} is listed as ${member.role.toLowerCase()}. New people from Excel join as members.`);
      }
      const created = await tx.membership.create({
        data: {
          chamaId: input.chamaId,
          personId: person.id,
          role: "MEMBER",
          memberNo,
          joinDate: member.joinDate ? new Date(`${member.joinDate}T00:00:00.000Z`) : new Date(),
          status: "ACTIVE",
          hashedPin: pinByPhone.get(member.phone) ?? (await hashPin(String(randomInt(0, 10000)).padStart(4, "0"))),
        },
        include: { person: true },
      });
      membershipByPhone.set(member.phone, created);
      membershipByNo.set(memberNo, created);
      membersAdded += 1;
    }

    const payments = await tx.contribution.findMany({
      where: { chamaId: input.chamaId, reversesId: null },
      select: { id: true, membershipId: true, period: true, amountCents: true },
    });
    const seen = new Map(payments.map((payment) => [`${payment.membershipId}:${payment.period}`, payment]));
    let contributionsAdded = 0;
    let contributionsUpdated = 0;
    let contributionsSkipped = 0;

    for (const payment of input.workbook.contributions) {
      const membership =
        (payment.phone ? membershipByPhone.get(payment.phone) : undefined) ??
        (payment.memberNo ? membershipByNo.get(payment.memberNo) : undefined);
      if (!membership) {
        note(problems, `${payment.sheet} row ${payment.row}: no member to attach the ${payment.period} payment to.`);
        continue;
      }
      const key = `${membership.id}:${payment.period}`;
      const existing = seen.get(key);
      if (existing) {
        if (existing.amountCents === payment.amountCents) {
          contributionsSkipped += 1;
          continue;
        }
        await tx.contribution.update({
          where: { id: existing.id },
          data: { amountCents: payment.amountCents },
        });
        existing.amountCents = payment.amountCents;
        contributionsUpdated += 1;
        continue;
      }
      const created = await tx.contribution.create({
        data: {
          chamaId: input.chamaId,
          membershipId: membership.id,
          amountCents: payment.amountCents,
          period: payment.period,
          datePaid: new Date(`${payment.period}-01T00:00:00.000Z`),
          method: "CASH",
          source: "IMPORT",
          reference: `${payment.sheet} row ${payment.row}`,
        },
      });
      seen.set(key, {
        id: created.id,
        membershipId: membership.id,
        period: payment.period,
        amountCents: payment.amountCents,
      });
      contributionsAdded += 1;
    }

    await appendAuditInTransaction(tx, {
      chamaId: input.chamaId,
      membershipId: input.actor.membershipId,
      personId: input.actor.personId,
      action: "import.excel",
      entityType: "Chama",
      entityId: input.chamaId,
      after: {
        membersAdded,
        contributionsAdded,
        contributionsUpdated,
        fileName: importFileLabel(input.fileName ?? "Excel"),
      },
    });

    return { membersAdded, membersAlready, contributionsAdded, contributionsUpdated, contributionsSkipped, problems };
  });
}
