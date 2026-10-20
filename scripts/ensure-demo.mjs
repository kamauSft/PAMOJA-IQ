import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const envPath = new URL("../.env", import.meta.url);
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

const db = new PrismaClient();
const tsxCli = path.resolve("node_modules/tsx/dist/cli.mjs");
try {
  const count = await db.membership.count();
  if (count > 0) {
    console.log("Records are already there. Leaving them as they are.");
  } else if (process.env.DEMO_MODE === "true") {
    console.log("The records are empty. Adding the demo chama.");
    execFileSync(process.execPath, [tsxCli, "prisma/seed.ts"], { stdio: "inherit" });
  } else {
    console.log("The records are empty. Demo members stay off unless DEMO_MODE is true.");
  }
  if (process.env.DEMO_MODE === "true") {
    execFileSync(process.execPath, [tsxCli, "scripts/refresh-demo-pins.ts"], { stdio: "inherit" });
  }
  execFileSync(process.execPath, [tsxCli, "scripts/ensure-owner.ts"], { stdio: "inherit" });
} catch {
  console.error("The records could not be opened. Run start-pamoja.bat again.");
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
