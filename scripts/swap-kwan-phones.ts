/** Replace KWAN placeholder phones with real ones when the chama supplies them. */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function args() {
  const values = process.argv.slice(2);
  const get = (flag: string) => {
    const index = values.indexOf(flag);
    return index >= 0 ? values[index + 1] ?? "" : "";
  };
  const phones = get("--phones");
  const out = get("--out");
  if (!phones || !out) {
    throw new Error("Usage: tsx scripts/swap-kwan-phones.ts --phones <member_no,phone.csv> --out <new-credentials.csv>");
  }
  const output = path.resolve(out);
  if (output.startsWith(path.resolve(".") + path.sep)) throw new Error("Write the credential sheet outside the repository.");
  return { phones: path.resolve(phones), out: output, db: get("--db") || "file:./kwan.db" };
}

function parseCsv(file: string): Array<{ memberNo: string; phone: string }> {
  return readFileSync(file, "utf8")
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [memberNo = "", phone = ""] = line.split(",").map((value) => value.replace(/^"|"$/g, "").trim());
      return { memberNo, phone };
    })
    .filter((row) => row.memberNo && row.phone);
}

async function main() {
  const options = args();
  process.env.DATABASE_URL = options.db;
  process.env.DEMO_MODE = "false";

  const { prismaRaw } = await import("../lib/db");
  const { normalizePhone } = await import("../lib/phone");
  const { hashPin } = await import("../lib/auth/pin");
  const { randomMemberPin } = await import("../lib/auth/pin-policy");

  const chama = await prismaRaw.chama.findFirstOrThrow({ where: { name: "KWAN Funeral Fund" } });
  const rows = parseCsv(options.phones);
  const changes: Array<{ memberNo: string; name: string; phone: string; pin: string }> = [];
  const used = new Set<string>();
  const pins = await Promise.all(rows.map(() => randomMemberPin()));

  await prismaRaw.$transaction(async (tx) => {
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const phone = normalizePhone(row.phone);
      if (!phone) throw new Error(`Bad phone for member ${row.memberNo}.`);
      if (used.has(phone)) throw new Error(`Phone ${phone} is listed twice.`);
      used.add(phone);
      const membership = await tx.membership.findUniqueOrThrow({
        where: { chamaId_memberNo: { chamaId: chama.id, memberNo: row.memberNo } },
        include: { person: true },
      });
      if (membership.role !== "MEMBER") throw new Error(`${row.memberNo} is not a member.`);
      const taken = await tx.person.findUnique({ where: { phone } });
      if (taken && taken.id !== membership.personId) throw new Error(`Phone ${phone} already belongs to someone else.`);
      await tx.person.update({ where: { id: membership.personId }, data: { phone } });
      await tx.membership.update({
        where: { id: membership.id },
        data: { hashedPin: await hashPin(pins[index] ?? randomMemberPin()) },
      });
      await tx.session.updateMany({ where: { membershipId: membership.id }, data: { revokedAt: new Date() } });
      changes.push({ memberNo: row.memberNo, name: membership.person.name, phone, pin: pins[index] ?? "" });
    }
  });

  const csv = (values: string[]) => values.map((value) => `"${value.replace(/"/g, '""')}"`).join(",");
  const lines = [csv(["role", "name", "member_no", "login_phone", "pin"])];
  for (const change of changes) lines.push(csv(["MEMBER", change.name, change.memberNo, change.phone, change.pin]));
  writeFileSync(options.out, `\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
  console.log(`Swapped ${changes.length} phones and issued fresh PINs. New sheet: ${options.out}`);
  await prismaRaw.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
