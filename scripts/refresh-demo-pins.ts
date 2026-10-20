import { PrismaClient } from "@prisma/client";
import { hashPin } from "../lib/auth/pin";
import { DEMO_PIN, members } from "../prisma/seed-data";

async function main() {
  if (process.env.DEMO_MODE !== "true") {
    console.log("Practice password left as it is.");
    return;
  }
  const db = new PrismaClient();
  try {
    const hashedPin = await hashPin(DEMO_PIN);
    const people = await db.person.findMany({
      where: { phone: { in: members.map((member) => member.phone) } },
      select: { id: true },
    });
    for (const person of people) {
      await db.membership.updateMany({ where: { personId: person.id }, data: { hashedPin } });
      await db.person.update({
        where: { id: person.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }
    console.log(`Practice password set for ${people.length} demo people.`);
  } finally {
    await db.$disconnect();
  }
}

main();
