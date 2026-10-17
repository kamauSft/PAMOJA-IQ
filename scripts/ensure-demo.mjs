import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const db = new PrismaClient();
try {
  const count = await db.membership.count();
  if (count === 0) {
    console.log("The records are empty. Adding the demo chama.");
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
  } else {
    console.log("Records are already there. Leaving them as they are.");
  }
} catch (error) {
  console.error("The records could not be opened. Run start-pamoja.bat again.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
