/**
 * One-off, private onboarding for the real KWAN funeral fund.
 *
 * The workbook never enters the repository. This script creates a NEW chama in
 * a separate database, gives every member a deterministic placeholder phone and
 * a unique 6-digit PIN, gives the treasurer an 8-digit PIN, imports the historic
 * register, and publishes the positions so dashboards work immediately.
 *
 * Real phones, names, PINs and the credential sheet stay outside version
 * control. Nothing here touches the demo database or the GitHub Pages demo.
 */

import ExcelJS from "exceljs";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { isKwanWorkbook, parseKwanWorkbook, placeholderPhone } from "../lib/import/kwan";

const CHAMA_NAME = "KWAN Funeral Fund";

interface Options {
  workbook: string;
  out: string;
  db: string;
  treasurerName: string;
  treasurerPhone: string;
}

function args(): Options {
  const values = process.argv.slice(2);
  const get = (flag: string, fallback = "") => {
    const index = values.indexOf(flag);
    return index >= 0 ? values[index + 1] ?? "" : fallback;
  };
  const workbook = get("--workbook");
  const out = get("--out");
  const treasurerName = get("--treasurer-name");
  const treasurerPhone = get("--treasurer-phone");
  if (!workbook || !out || !treasurerName || !treasurerPhone) {
    throw new Error(
      "Usage: tsx scripts/onboard-kwan.ts --workbook <file.xlsx> --out <credentials.csv> --treasurer-name 'Name' --treasurer-phone 07... [--db file:./kwan.db]",
    );
  }
  const db = get("--db", "file:./kwan.db");
  if (!db.startsWith("file:")) throw new Error("Use a private SQLite file, for example --db file:./kwan.db");
  const basename = path.basename(db).toLowerCase();
  if (["dev.db", "test.db", "e2e.db"].includes(basename)) {
    throw new Error(`${basename} belongs to the demo/tests. Choose a separate KWAN database.`);
  }
  const output = path.resolve(out);
  const repo = path.resolve(".") + path.sep;
  if (output.startsWith(repo)) throw new Error("Write the credential sheet outside the repository.");
  return {
    workbook: path.resolve(workbook),
    out: output,
    db,
    treasurerName,
    treasurerPhone,
  };
}

function csv(values: Array<string | number>): string {
  return values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",");
}

async function main() {
  const options = args();
  process.env.DATABASE_URL = options.db;
  process.env.DEMO_MODE = "false";

  const book = new ExcelJS.Workbook();
  await book.xlsx.readFile(options.workbook);
  if (!isKwanWorkbook(book)) throw new Error("That workbook is not a KWAN funeral register.");

  const { prismaRaw } = await import("../lib/db");
  const { hashPin } = await import("../lib/auth/pin");
  const { randomOfficialPin, randomMemberPin } = await import("../lib/auth/pin-policy");
  const { normalizePhone } = await import("../lib/phone");
  const { umojaSettings } = await import("../lib/chama/rules");
  const { appendAuditInTransaction } = await import("../lib/audit/log");
  const { saveImport } = await import("../lib/import/save");
  const { publishPositions } = await import("../lib/chama/publish");

  let existing = 0;
  try {
    existing = await prismaRaw.chama.count({ where: { name: CHAMA_NAME } });
  } catch {
    throw new Error(`Open the private database first: DATABASE_URL="${options.db}" npx prisma db push`);
  }
  if (existing > 0) throw new Error(`${CHAMA_NAME} is already in ${options.db}. Refusing to duplicate the chama.`);

  const phone = normalizePhone(options.treasurerPhone);
  if (!phone) throw new Error("The treasurer needs a valid Kenyan phone number.");
  if (await prismaRaw.person.findUnique({ where: { phone } })) {
    throw new Error("That phone number is already in this database.");
  }

  const roster = parseKwanWorkbook(book, { phoneFor: placeholderPhone });
  if (roster.members.length === 0) throw new Error("No members were found in the register.");
  const pins = roster.members.map((member) => ({ ...member, pin: randomMemberPin() }));
  const officialPin = randomOfficialPin();

  const settings = {
    ...umojaSettings,
    monthlyContributionCents: 30_000,
    constitution:
      "KWAN Funeral Fund. Collections are recorded for each bereavement event from June 2020 to August 2025. " +
      "The treasurer keeps the register and publishes each position. A member sees only their own contributions. " +
      "Where the source sheet gave only a year, events are placed in consecutive months of that year in sheet order.",
  };

  const hashedPins = new Map<string, string>();
  for (const member of pins) hashedPins.set(member.memberNo ?? "", await hashPin(member.pin));
  const hashedOfficialPin = await hashPin(officialPin);

  const chamaId = await prismaRaw.$transaction(async (tx) => {
    const chama = await tx.chama.create({
      data: { name: CHAMA_NAME, currency: "KES", settings, status: "ACTIVE", plan: "PRO" },
    });
    const person = await tx.person.create({
      data: {
        name: options.treasurerName,
        phone,
        preferredLanguage: "EN",
        channelPrefs: { whatsapp: true, sms: true, ussd: false },
        consent: { privacyNotice: true, whatsapp: true, sms: true, dataProcessing: true, consentedAt: new Date().toISOString() },
      },
    });
    const membership = await tx.membership.create({
      data: {
        chamaId: chama.id,
        personId: person.id,
        role: "TREASURER",
        memberNo: "T001",
        joinDate: new Date("2020-06-01T00:00:00.000Z"),
        status: "ACTIVE",
        hashedPin: hashedOfficialPin,
      },
    });
    for (const member of roster.members) {
      const memberPerson = await tx.person.create({
        data: {
          name: member.name,
          phone: member.phone,
          preferredLanguage: "EN",
          channelPrefs: { whatsapp: true, sms: true, ussd: false },
          consent: { privacyNotice: true, dataProcessing: true, consentedAt: new Date().toISOString() },
        },
      });
      await tx.membership.create({
        data: {
          chamaId: chama.id,
          personId: memberPerson.id,
          role: "MEMBER",
          memberNo: member.memberNo ?? "",
          joinDate: new Date(`${member.joinDate}T00:00:00.000Z`),
          status: "ACTIVE",
          hashedPin: hashedPins.get(member.memberNo ?? "") ?? (await hashPin(randomMemberPin())),
        },
      });
    }
    await appendAuditInTransaction(tx, {
      chamaId: chama.id,
      membershipId: membership.id,
      personId: person.id,
      action: "chama.started",
      entityType: "Chama",
      entityId: chama.id,
      after: { name: CHAMA_NAME, members: pins.length, source: "private onboarding" },
    });
    return chama.id;
  });

  const treasurer = await prismaRaw.membership.findFirstOrThrow({
    where: { chamaId, role: "TREASURER" },
    include: { person: true },
  });
  const actor = { membershipId: treasurer.id, personId: treasurer.personId, role: "TREASURER" as const };

  const saved = await saveImport({
    chamaId,
    actor,
    workbook: roster,
    fileName: "KWAN 2020-2025 register",
  });
  const published = await publishPositions({ chamaId, actor });

  const lines = [csv(["role", "name", "member_no", "login_phone", "pin"])];
  lines.push(csv(["TREASURER", options.treasurerName, "T001", phone, officialPin]));
  for (const member of pins) {
    lines.push(csv(["MEMBER", member.name, member.memberNo ?? "", member.phone, member.pin]));
  }
  writeFileSync(options.out, `\uFEFF${lines.join("\r\n")}\r\n`, "utf8");

  console.log(`Chama: ${CHAMA_NAME} (${chamaId})`);
  console.log(`Members created: ${pins.length}`);
  console.log(`Payments added: ${saved.contributionsAdded}, updated: ${saved.contributionsUpdated}, skipped: ${saved.contributionsSkipped}`);
  console.log(`Positions published to ${published.members} members.`);
  console.log(`Credential sheet written outside the repository: ${options.out}`);
  if (saved.problems.length) console.log(`Import notes: ${saved.problems.length} (first: ${saved.problems[0]})`);
  await prismaRaw.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
