import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.replace(/\r$/, "").match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

const periods = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];

async function main() {
  const phone = process.env.OWNER_PHONE?.trim();
  const name = process.env.OWNER_NAME?.trim();
  if (!phone || !name) {
    console.log("OWNER_PHONE or OWNER_NAME is not set. No member was added.");
    return;
  }
  const { normalizePhone } = await import("../lib/phone");
  const { prismaRaw } = await import("../lib/db");
  const normalized = normalizePhone(phone);
  if (!normalized) throw new Error("OWNER_PHONE is not a Kenyan mobile number.");
  try {
    const person = await prismaRaw.person.findUnique({ where: { phone: normalized } });
    if (!person) {
      console.log("No account uses that phone yet. Sign in is unchanged.");
      return;
    }
    if (person.name !== name) {
      await prismaRaw.person.update({ where: { id: person.id }, data: { name } });
    }
    const posts = await prismaRaw.membership.findMany({
      where: { personId: person.id, role: "TREASURER", status: "ACTIVE" },
    });
    let added = 0;
    for (const post of posts) {
      const already = await prismaRaw.membership.findFirst({
        where: { chamaId: post.chamaId, personId: person.id, role: "MEMBER" },
      });
      if (already) continue;
      const taken = new Set(
        (await prismaRaw.membership.findMany({ where: { chamaId: post.chamaId }, select: { memberNo: true } })).map(
          (row) => row.memberNo,
        ),
      );
      let number = 1;
      while (taken.has(`M${String(number).padStart(3, "0")}`)) number += 1;
      const memberNo = `M${String(number).padStart(3, "0")}`;
      const membership = await prismaRaw.membership.create({
        data: {
          chamaId: post.chamaId,
          personId: person.id,
          role: "MEMBER",
          memberNo,
          joinDate: post.joinDate,
          status: "ACTIVE",
          hashedPin: post.hashedPin,
        },
      });
      for (const period of periods) {
        const [year, month] = period.split("-").map(Number);
        const datePaid = new Date(Date.UTC(year, month - 1, 2));
        await prismaRaw.contribution.create({
          data: {
            chamaId: post.chamaId,
            membershipId: membership.id,
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
          chamaId: post.chamaId,
          membershipId: membership.id,
          title: "School fees",
          targetCents: 8_000_000,
          targetDate: new Date("2027-01-31T00:00:00.000Z"),
        },
      });
      added += 1;
    }
    console.log(added === 0 ? "The member record was already there." : `Added ${added} member record.`);
  } finally {
    const { prismaRaw } = await import("../lib/db");
    await prismaRaw.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
