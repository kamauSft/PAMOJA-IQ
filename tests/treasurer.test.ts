import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import { createTreasurerProfile } from "@/lib/chama/create-profile";
import { addMember } from "@/lib/chama/add-member";
import { loginWithPin } from "@/lib/auth/service";
import { validatePin } from "@/lib/auth/pin-policy";
import { placementFor } from "@/lib/import/identify";
import { saveImport } from "@/lib/import/save";
import { readUpload, shillingsToCents, templateWorkbook } from "@/lib/import/workbook";
import { prismaRaw } from "@/lib/db";
import { resetDatabase } from "./db";

afterEach(async () => {
  await resetDatabase();
});

describe("excel amounts", () => {
  it("reads the ways a treasurer writes shillings", () => {
    expect(shillingsToCents("2,000")).toBe(200_000);
    expect(shillingsToCents("2000/=")).toBe(200_000);
    expect(shillingsToCents("Ksh 2000")).toBe(200_000);
    expect(shillingsToCents("2k")).toBe(200_000);
    expect(shillingsToCents("0")).toBe(0);
    expect(shillingsToCents("later")).toBeNull();
  });

  it("reads the filled template and the messy register", async () => {
    const filled = await readUpload(await readFile("fixtures/pamoja-template-filled.xlsx"), "filled.xlsx");
    expect(filled.members.map((member) => member.phone).sort()).toEqual(["+254712345002", "+254712345005"]);
    expect(filled.contributions).toHaveLength(5);
    expect(filled.contributions.every((row) => row.amountCents === 200_000)).toBe(true);
    expect(filled.problems).toEqual([]);

    const messy = await readUpload(await readFile("fixtures/treasurer-messy.xlsx"), "messy.xlsx");
    expect(messy.members).toHaveLength(2);
    expect(messy.members.map((member) => member.name)).not.toContain("JUMLA");
    expect(messy.contributions).toHaveLength(4);
    expect(messy.contributions.every((row) => row.amountCents === 200_000)).toBe(true);
    expect(messy.contributions.find((row) => row.name === "Amina Hassan")?.phone).toBe("+254712345005");

    const csv = Buffer.from("Jina,Simu,Jan 2026\nAsha Njeri,0712555011,\"2,000\"\n");
    const plain = await readUpload(csv, "register.csv");
    expect(plain.members.map((member) => member.phone)).toEqual(["+254712555011"]);
    expect(plain.contributions).toHaveLength(1);
    expect(plain.contributions[0]?.amountCents).toBe(200_000);
    await expect(readUpload(Buffer.from("not a workbook"), "notes.pdf")).rejects.toThrow();
  });

  it("reads the two messy samples and keeps different October amounts", async () => {
    const first = await readUpload(await readFile("public/samples/messy-register-1.xlsx"), "messy-register-1.xlsx");
    const second = await readUpload(await readFile("public/samples/messy-register-2.xlsx"), "messy-register-2.xlsx");
    const amount = (book: typeof first, phone: string) => book.contributions.find((row) => row.phone === phone)?.amountCents;
    expect(first.problems).toEqual([]);
    expect(second.problems).toEqual([]);
    expect(amount(first, "+254712345005")).toBe(150_000);
    expect(amount(second, "+254712345005")).toBe(450_000);
    expect(amount(first, "+254712345002")).toBe(220_000);
    expect(amount(second, "+254712345002")).toBe(90_000);
    expect(amount(first, "+254712345001")).toBe(180_000);
    expect(amount(second, "+254712345001")).toBe(310_000);
    expect(first.members.map((member) => member.name)).not.toContain("JUMLA");
    expect(second.members.map((member) => member.name)).not.toContain("Total");
  });

  it("reads a swahili month, a date beside an amount, and a name that is already on the register", async () => {
    const swahili = Buffer.from("Jina,Simu,Oktoba 2026\nAsha Njeri,0712555011,\"2,000\"\nJUMLA,,4000\n");
    const read = await readUpload(swahili, "oktoba.csv");
    expect(read.contributions).toEqual([
      expect.objectContaining({ name: "Asha Njeri", phone: "+254712555011", period: "2026-10", amountCents: 200_000 }),
    ]);

    const dated = Buffer.from(
      "October 2026 meeting\nName,Phone,Date,Amount\nAmina Hassan,0712345005,03/10/2026,\"1,500\"\nPeter Otieno,0712345002,,\"2,200/=\"\n",
    );
    const meeting = await readUpload(dated, "meeting.csv");
    expect(meeting.contributions.map((row) => [row.phone, row.period, row.amountCents])).toEqual([
      ["+254712345005", "2026-10", 150_000],
      ["+254712345002", "2026-10", 220_000],
    ]);

    const kiasi = Buffer.from("Umoja — Oktoba 2026\nMwanachama,Mobile No.,Kiasi\nPeter Otieno,0712345002,900\n");
    const cash = await readUpload(kiasi, "kiasi.csv");
    expect(cash.contributions[0]).toMatchObject({ phone: "+254712345002", period: "2026-10", amountCents: 90_000 });

    const known = [
      { personId: "1", name: "Amina Hassan Bakari", phone: "+254712345005", memberNo: "M001", role: "MEMBER", status: "ACTIVE" },
      { personId: "2", name: "Grace Wanjiku", phone: "+254712000001", memberNo: "M002", role: "MEMBER", status: "ACTIVE" },
      { personId: "3", name: "Grace Wanjiku Mwangi", phone: "+254712000002", memberNo: "M003", role: "MEMBER", status: "ACTIVE" },
    ];
    expect(placementFor({ name: "Amina Hassan", phone: null, memberNo: null }, known)).toMatchObject({
      placement: "name",
      placedNo: "M001",
    });
    expect(placementFor({ name: "Grace Wanjiku", phone: null, memberNo: null }, known).placement).toBe("ambiguous");
    expect(placementFor({ name: "Grace", phone: null, memberNo: null }, known).placement).toBe("left");
    expect(placementFor({ name: "Peter Otieno", phone: "+254712345002", memberNo: null }, known).placement).toBe("new");
  });

  it("builds a blank template with member and month columns", async () => {
    const blank = await readUpload(await templateWorkbook(), "pamoja-members.xlsx");
    expect(blank.members).toEqual([]);
    expect(blank.contributions).toEqual([]);
  });
});

describe("treasurer profile and import", () => {
  it("creates a treasurer and refuses a second profile on the same number", async () => {
    const created = await createTreasurerProfile({
      name: "Jane Wanjiku",
      phone: "0712 000 111",
      pin: "Ab3!@cde",
      chamaName: "Mwanga",
    });
    expect(created).toEqual({ ok: true, phone: "0712 000 111", chamaName: "Mwanga" });
    const again = await createTreasurerProfile({
      name: "Jane Wanjiku",
      phone: "0712000111",
      pin: "Ab3!@cde",
      chamaName: "Another",
    });
    expect(again).toMatchObject({ ok: false });
    expect(await prismaRaw.chama.count()).toBe(1);

    const signIn = await loginWithPin({ phone: "0712000111", pin: "Ab3!@cde" });
    expect(signIn.status).toBe("authenticated");

    const rejected = await createTreasurerProfile({ name: "A", phone: "123", pin: "12", chamaName: "X" });
    expect(rejected.ok).toBe(false);
  });

  it("adds members and payments, then skips them on a second upload", async () => {
    await createTreasurerProfile({
      name: "Jane Wanjiku",
      phone: "0712000111",
      pin: "Ab3!@cde",
      chamaName: "Mwanga",
    });
    const treasurer = await prismaRaw.membership.findFirstOrThrow({ include: { person: true } });
    const workbook = await readUpload(await readFile("fixtures/treasurer-messy.xlsx"), "messy.xlsx");
    const saved = await saveImport({
      chamaId: treasurer.chamaId,
      actor: { membershipId: treasurer.id, personId: treasurer.personId, role: "TREASURER" },
      workbook,
      fileName: "C:\\books\\messy.xlsx",
    });
    expect(saved.membersAdded).toBe(2);
    expect(saved.contributionsAdded).toBe(4);
    expect(await prismaRaw.membership.count()).toBe(3);

    const again = await saveImport({
      chamaId: treasurer.chamaId,
      actor: { membershipId: treasurer.id, personId: treasurer.personId, role: "TREASURER" },
      workbook,
    });
    expect(again.membersAdded).toBe(0);
    expect(again.membersAlready).toBe(2);
    expect(again.contributionsAdded).toBe(0);
    expect(again.contributionsSkipped).toBe(4);
    expect(await prismaRaw.contribution.count()).toBe(4);
    const logged = await prismaRaw.auditLog.findFirst({ where: { action: "import.excel" }, orderBy: { seq: "asc" } });
    expect(logged?.after).toMatchObject({ fileName: "messy.xlsx" });
  });

  it("places a short name on the one member it fits", async () => {
    await createTreasurerProfile({
      name: "Jane Wanjiku",
      phone: "0712000333",
      pin: "Ab3!@cde",
      chamaName: "Mwanga",
    });
    const treasurer = await prismaRaw.membership.findFirstOrThrow({ include: { person: true } });
    const added = await addMember({
      chamaId: treasurer.chamaId,
      actor: { membershipId: treasurer.id, personId: treasurer.personId, role: "TREASURER" },
      name: "Amina Hassan Bakari",
      phone: "0712345005",
    });
    expect(added.ok).toBe(true);
    const workbook = await readUpload(Buffer.from("Jina,Oktoba 2026\nAmina Hassan,\"1,500\"\n"), "names.csv");
    const saved = await saveImport({
      chamaId: treasurer.chamaId,
      actor: { membershipId: treasurer.id, personId: treasurer.personId, role: "TREASURER" },
      workbook,
      fileName: "names.csv",
    });
    expect(saved.membersAdded).toBe(0);
    expect(saved.contributionsAdded).toBe(1);
    const payment = await prismaRaw.contribution.findFirstOrThrow({ include: { membership: { include: { person: true } } } });
    expect(payment.membership.person.name).toBe("Amina Hassan Bakari");
    expect(payment.amountCents).toBe(150_000);
    expect(payment.period).toBe("2026-10");
  });

  it("adds one member the treasurer can send to the member door", async () => {
    await createTreasurerProfile({
      name: "Jane Wanjiku",
      phone: "0712000222",
      pin: "Ab3!@cde",
      chamaName: "Mwanga",
    });
    const treasurer = await prismaRaw.membership.findFirstOrThrow({ include: { person: true } });
    const added = await addMember({
      chamaId: treasurer.chamaId,
      actor: { membershipId: treasurer.id, personId: treasurer.personId, role: "TREASURER" },
      name: "Asha Njeri",
      phone: "0712555099",
    });
    expect(added).toMatchObject({ ok: true, memberNo: "M001", phone: "+254712555099", keptOfficialPin: false });
    if (!added.ok) return;
    expect(validatePin(added.temporaryPin)).toBeNull();
    expect((await loginWithPin({ phone: "0712555099", pin: added.temporaryPin, role: "MEMBER" })).status).toBe("authenticated");
    const addedLog = await prismaRaw.auditLog.findFirst({ where: { action: "member.added" } });
    expect(JSON.stringify(addedLog?.after ?? {})).not.toContain(added.temporaryPin);
    const duplicate = await addMember({
      chamaId: treasurer.chamaId,
      actor: { membershipId: treasurer.id, personId: treasurer.personId, role: "TREASURER" },
      name: "Asha Njeri",
      phone: "0712555099",
    });
    expect(duplicate.ok).toBe(false);
    const refused = await addMember({
      chamaId: treasurer.chamaId,
      actor: { membershipId: treasurer.id, personId: treasurer.personId, role: "MEMBER" },
      name: "Someone Else",
      phone: "0712555088",
    });
    expect(refused.ok).toBe(false);
    const alsoMember = await addMember({
      chamaId: treasurer.chamaId,
      actor: { membershipId: treasurer.id, personId: treasurer.personId, role: "TREASURER" },
      name: "Jane Wanjiku",
      phone: "0712000222",
    });
    expect(alsoMember).toMatchObject({ ok: true, keptOfficialPin: true });
    if (!alsoMember.ok) return;
    expect(validatePin(alsoMember.temporaryPin)).toBeNull();
    expect((await loginWithPin({ phone: "0712000222", pin: alsoMember.temporaryPin, role: "MEMBER" })).status).toBe("authenticated");
    expect((await loginWithPin({ phone: "0712000222", pin: "Ab3!@cde", role: "TREASURER" })).status).toBe("authenticated");
  });
});
