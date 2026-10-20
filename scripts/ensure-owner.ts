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

async function main() {
  const phone = process.env.OWNER_PHONE?.trim();
  const name = process.env.OWNER_NAME?.trim();
  if (!phone || !name) {
    console.log("OWNER_PHONE or OWNER_NAME is not set. No member was added.");
    return;
  }
  const { DEMO_PIN } = await import("../prisma/seed-data");
  const { ensureOwnerAccount } = await import("../lib/chama/ensure-owner");
  const { prismaRaw } = await import("../lib/db");
  try {
    const result = await ensureOwnerAccount({ phone, name, pin: DEMO_PIN });
    if (!result.ok) {
      console.log(result.message);
      return;
    }
    console.log("The owner can sign in on the member door and the treasurer door.");
  } finally {
    await prismaRaw.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
