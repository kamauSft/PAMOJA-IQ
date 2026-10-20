import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import { createTreasurerProfile } from "@/lib/chama/create-profile";
import { addMember } from "@/lib/chama/add-member";
import { loginWithPin } from "@/lib/auth/service";
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
      pin: "2468",
      chamaName: "Mwanga",
    });
    expect(created).toEqual({ ok: true, phone: "0712 000 111", chamaName: "Mwanga" });
    const again = await createTreasurerProfile({
      name: "Jane Wanjiku",
      phone: "0712000111",
      pin: "2468",
      chamaName: "Another",
    });
    expect(again).toMatchObject({ ok: false });
    expect(await prismaRaw.chama.count()).toBe(1);

    const signIn = await loginWithPin({ phone: "0712000111", pin: "2468" });
    expect(signIn.status).toBe("authenticated");

    const rejected = await createTreasurerProfile({ name: "A", phone: "123", pin: "12", chamaName: "X" });
    expect(rejected.ok).toBe(false);
  });

  it("adds members and payments, then skips them on a second upload", async () => {
    await createTreasurerProfile({
      name: "Jane Wanjiku",
      phone: "0712000111",
      pin: "2468",
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

  it("adds one member the treasurer can send to the member door", async () => {
    await createTreasurerProfile({
      name: "Jane Wanjiku",
      phone: "0712000222",
      pin: "2468",
      chamaName: "Mwanga",
    });
    const treasurer = await prismaRaw.membership.findFirstOrThrow({ include: { person: true } });
    const added = await addMember({
      chamaId: treasurer.chamaId,
      actor: { membershipId: treasurer.id, personId: treasurer.personId, role: "TREASURER" },
      name: "Asha Njeri",
      phone: "0712555099",
    });
    expect(added).toMatchObject({ ok: true, memberNo: "M001", phone: "+254712555099" });
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
  });
});
