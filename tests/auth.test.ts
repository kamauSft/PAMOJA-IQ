import { afterEach, describe, expect, it } from "vitest";
import { hashPin } from "@/lib/auth/pin";
import { maskPhone, normalizePhone } from "@/lib/auth/phone";
import { consumeRateLimit, resetRateLimits } from "@/lib/auth/rate-limit";
import { sessionCookieOptions } from "@/lib/auth/session";
import { resetLoginLockouts } from "@/lib/auth/lockout";
import { getSession, loginWithPin, logout, logoutAll, setMemberPin } from "@/lib/auth/service";
import { issueTemporaryPin, unlockAccount } from "@/lib/auth/unlock";
import { MemoryMessagingProvider } from "@/lib/messaging/provider";
import { prismaRaw } from "@/lib/db";
import { umojaSettings } from "@/lib/chama/rules";
import { loanApprovalsSatisfied } from "@/lib/approvals/maker-checker";
import { parseChamaSettings } from "@/lib/chama/rules";
import { resetDatabase } from "./db";

const now = new Date("2026-10-16T09:00:00.000Z");

async function member(input: {
  phone: string;
  role?: "MEMBER" | "TREASURER" | "CHAIR";
  chamaName?: string;
  pin?: string;
}) {
  const chama = await prismaRaw.chama.create({
    data: { name: input.chamaName ?? "Umoja", settings: umojaSettings, plan: "PRO", status: "ACTIVE" },
  });
  const person = await prismaRaw.person.create({
    data: { name: "Tester", phone: input.phone, channelPrefs: {}, consent: {} },
  });
  const membership = await prismaRaw.membership.create({
    data: {
      chamaId: chama.id,
      personId: person.id,
      role: input.role ?? "MEMBER",
      memberNo: "M001",
      joinDate: new Date("2026-01-03T00:00:00.000Z"),
      hashedPin: await hashPin(input.pin ?? "2580"),
    },
  });
  return { chama, person, membership };
}

afterEach(async () => {
  resetRateLimits();
  await resetDatabase();
});

describe("auth", () => {
  it("normalises Safaricom numbers and masks them", () => {
    expect(normalizePhone("0712345005")).toBe("+254712345005");
    expect(normalizePhone("712345005")).toBe("+254712345005");
    expect(normalizePhone("254712345005")).toBe("+254712345005");
    expect(normalizePhone("+254 712 345 005")).toBe("+254712345005");
    expect(normalizePhone("12345")).toBeNull();
    expect(maskPhone("+254712345005")).toBe("+254712***005");
    expect(maskPhone("123")).toBe("hidden");
  });

  it("signs in a member and locks the phone after five bad PINs", async () => {
    await member({ phone: "+254712345005" });
    const ok = await loginWithPin({ phone: "0712345005", pin: "2580", now });
    expect(ok.status).toBe("authenticated");
    if (ok.status !== "authenticated") return;
    const session = await getSession(ok.token, new Date(now.getTime() + 60_000));
    expect(session?.role).toBe("MEMBER");
    const stillSignedIn = new Date(now.getTime() + 60_000 + 31 * 60_000);
    expect(await getSession(ok.token, stillSignedIn)).not.toBeNull();
    expect(await getSession(ok.token, new Date(stillSignedIn.getTime() + 31 * 24 * 60 * 60_000))).toBeNull();

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const failed = await loginWithPin({ phone: "+254712345005", pin: "0000", now });
      const triesLeft = 2 - attempt;
      expect(failed).toMatchObject({
        status: "invalid_credentials",
        triesLeft,
        message: `Wrong PIN. ${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left.`,
      });
    }
    const locked = await loginWithPin({ phone: "+254712345005", pin: "0000", now });
    expect(locked.status).toBe("locked");
    const still = await loginWithPin({ phone: "+254712345005", pin: "2580", now: new Date(now.getTime() + 60_000) });
    expect(still.status).toBe("locked");
    const later = await loginWithPin({
      phone: "+254712345005",
      pin: "2580",
      now: new Date(now.getTime() + 16 * 60_000),
    });
    expect(later.status).toBe("locked");
    expect(await loginWithPin({ phone: "nope", pin: "2580", now })).toMatchObject({
      status: "invalid_credentials",
      message: "Enter a Kenyan mobile number, like 0712 345 005.",
    });
    expect(await loginWithPin({ phone: "0711999000", pin: "2580", now })).toMatchObject({
      status: "unknown_number",
      message: "This number isn't registered. Ask your treasurer to add you.",
    });
  });

  it("asks an official for a one-time code and can sign every device out", async () => {
    const fixture = await member({ phone: "+254712345002", role: "TREASURER" });
    const other = await prismaRaw.chama.create({
      data: { name: "Second", settings: umojaSettings, plan: "FREE", status: "ACTIVE" },
    });
    await prismaRaw.membership.create({
      data: {
        chamaId: other.id,
        personId: fixture.person.id,
        role: "MEMBER",
        memberNo: "M009",
        joinDate: new Date("2026-02-01T00:00:00.000Z"),
        hashedPin: fixture.membership.hashedPin,
      },
    });
    const messaging = new MemoryMessagingProvider();
    const choice = await loginWithPin({ phone: "+254712345002", pin: "2580", now, messaging });
    expect(choice.status).toBe("choose_chama");
    if (choice.status !== "choose_chama") return;

    const authed = await loginWithPin({
      phone: "+254712345002",
      pin: "2580",
      chamaId: fixture.chama.id,
      now,
      messaging,
    });
    expect(authed.status).toBe("authenticated");
    if (authed.status !== "authenticated") return;
    expect(messaging.sent).toHaveLength(0);
    expect(await getSession(authed.token, new Date(now.getTime() + 31 * 60_000))).toBeNull();

    const second = await loginWithPin({ phone: "+254712345002", pin: "2580", chamaId: other.id, now });
    expect(second.status).toBe("authenticated");
    if (second.status !== "authenticated") return;
    await logoutAll(fixture.person.id, now);
    expect(await getSession(authed.token, now)).toBeNull();
    expect(await getSession(second.token, now)).toBeNull();
    await logout(authed.token, now);
  });

  it("lets one phone open the member door and the treasurer door", async () => {
    const fixture = await member({ phone: "+254711000111", role: "TREASURER" });
    await prismaRaw.membership.create({
      data: {
        chamaId: fixture.chama.id,
        personId: fixture.person.id,
        role: "MEMBER",
        memberNo: "M022",
        joinDate: new Date("2026-01-03T00:00:00.000Z"),
        hashedPin: fixture.membership.hashedPin,
      },
    });
    const asMember = await loginWithPin({ phone: "0711000111", pin: "2580", role: "MEMBER", now });
    expect(asMember).toMatchObject({ status: "authenticated", role: "MEMBER" });
    const asTreasurer = await loginWithPin({
      phone: "0711000111",
      pin: "2580",
      role: "TREASURER",
      now,
      demoOtpVisible: true,
    });
    expect(asTreasurer.status).toBe("authenticated");
  });

  it("signs a chair in with the PIN alone", async () => {
    await member({ phone: "+254712345001", role: "CHAIR" });
    expect(await loginWithPin({ phone: "+254712345001", pin: "2580", now })).toMatchObject({
      status: "authenticated",
      role: "CHAIR",
    });
  });

  it("texts a member a code, saves a PIN, and asks an official for a PIN first", async () => {
    const fixture = await member({ phone: "+254712345005" });
    const messaging = new MemoryMessagingProvider();
    expect(await loginWithPin({ phone: "0712345005", now, messaging })).toMatchObject({
      status: "pin_required",
      message: "Enter your PIN.",
    });

    expect(await setMemberPin({ membershipId: fixture.membership.id, personId: fixture.person.id, pin: "12" })).toMatchObject({
      ok: false,
    });
    expect(await setMemberPin({ membershipId: fixture.membership.id, personId: fixture.person.id, pin: "4321" })).toMatchObject({
      ok: false,
    });
    expect(await setMemberPin({ membershipId: fixture.membership.id, personId: fixture.person.id, pin: "482916" })).toEqual({
      ok: true,
    });
    expect((await loginWithPin({ phone: "0712345005", pin: "482916", now })).status).toBe("authenticated");

    await member({ phone: "+254712345002", role: "TREASURER" });
    expect(await loginWithPin({ phone: "0712345002", now, messaging })).toMatchObject({ status: "pin_required" });
    expect(messaging.sent.some((message) => message.to === "+254712345002")).toBe(false);
  });

  it("clears a lockout outside production", async () => {
    const fixture = await member({ phone: "+254712345099" });
    await prismaRaw.person.update({
      where: { id: fixture.person.id },
      data: { failedLoginAttempts: 3, lockedUntil: new Date(now.getTime() + 60_000) },
    });
    expect(await resetLoginLockouts("0712345099")).toBe(1);
    const cleared = await prismaRaw.person.findUniqueOrThrow({ where: { id: fixture.person.id } });
    expect(cleared.failedLoginAttempts).toBe(0);
    expect(cleared.lockedUntil).toBeNull();
    const env = process.env as { NODE_ENV?: string };
    const previous = env.NODE_ENV;
    env.NODE_ENV = "production";
    try {
      await expect(resetLoginLockouts()).rejects.toThrow(/production/);
    } finally {
      env.NODE_ENV = previous;
    }
    await expect(resetLoginLockouts("123")).rejects.toThrow(/Kenyan mobile/);
  });

  it("limits repeated calls and describes the session cookie", () => {
    expect(consumeRateLimit("login", 2, 1_000, 0).ok).toBe(true);
    expect(consumeRateLimit("login", 2, 1_000, 10).ok).toBe(true);
    expect(consumeRateLimit("login", 2, 1_000, 20).ok).toBe(false);
    expect(consumeRateLimit("login", 2, 1_000, 1_500).ok).toBe(true);
    const env = process.env as { NODE_ENV?: string };
    const previous = env.NODE_ENV;
    env.NODE_ENV = "production";
    expect(sessionCookieOptions().secure).toBe(true);
    env.NODE_ENV = "test";
    expect(sessionCookieOptions().secure).toBe(false);
    expect(sessionCookieOptions().httpOnly).toBe(true);
    expect(sessionCookieOptions().sameSite).toBe("lax");
    expect(sessionCookieOptions().maxAge).toBe(30 * 60);
    expect(sessionCookieOptions(30 * 24 * 60 * 60).maxAge).toBe(30 * 24 * 60 * 60);
    env.NODE_ENV = previous;
  });
});

describe("rules and maker-checker", () => {
  it("accepts the Umoja rules and rejects a backwards loan term", () => {
    expect(parseChamaSettings(umojaSettings).monthlyContributionCents).toBe(200_000);
    expect(() => parseChamaSettings({ ...umojaSettings, loanMinMonths: 6, loanMaxMonths: 1 })).toThrow(/loanMaxMonths/);
  });

  it("requires a second official above the limit and blocks self-approval", () => {
    const base = {
      amountCents: 1_000_000,
      limitCents: 2_000_000,
      requesterMembershipId: "member",
      borrowerMembershipId: "member",
      borrowerIsTreasurer: false,
      approvals: [{ membershipId: "treasurer", role: "TREASURER" as const }],
    };
    expect(loanApprovalsSatisfied(base).ok).toBe(true);
    expect(loanApprovalsSatisfied({ ...base, approvals: [{ membershipId: "member", role: "TREASURER" }] }).ok).toBe(false);
    expect(
      loanApprovalsSatisfied({
        ...base,
        borrowerIsTreasurer: true,
        borrowerMembershipId: "treasurer",
        requesterMembershipId: "treasurer",
        approvals: [{ membershipId: "chair", role: "CHAIR" }],
      }).ok,
    ).toBe(true);
    expect(
      loanApprovalsSatisfied({
        ...base,
        amountCents: 3_000_000,
        approvals: [
          { membershipId: "treasurer", role: "TREASURER" },
          { membershipId: "chair", role: "CHAIR" },
        ],
      }).ok,
    ).toBe(true);
    expect(loanApprovalsSatisfied({ ...base, amountCents: 3_000_000 }).reasons).toContain("NEEDS_TREASURER_AND_CHAIR");
    expect(
      loanApprovalsSatisfied({
        ...base,
        amountCents: 3_000_000,
        borrowerIsTreasurer: true,
        borrowerMembershipId: "treasurer",
        requesterMembershipId: "treasurer",
        approvals: [
          { membershipId: "chair", role: "CHAIR" },
          { membershipId: "secretary", role: "SECRETARY" },
        ],
      }).ok,
    ).toBe(true);
  });

  it("gives a member and a treasurer their own temporary PINs and keeps a lock until unlock", async () => {
    const treasurer = await member({ phone: "+254711000222", role: "TREASURER", pin: "2580" });
    const memberPost = await prismaRaw.membership.create({
      data: {
        chamaId: treasurer.chama.id,
        personId: treasurer.person.id,
        role: "MEMBER",
        memberNo: "M002",
        joinDate: new Date("2026-01-03T00:00:00.000Z"),
        hashedPin: treasurer.membership.hashedPin,
      },
    });
    const issued = await issueTemporaryPin({
      chamaId: treasurer.chama.id,
      actor: { membershipId: treasurer.membership.id, personId: treasurer.person.id, role: "TREASURER" },
      membershipId: memberPost.id,
      pin: "2580",
    });
    expect(issued.ok).toBe(true);
    if (!issued.ok) return;
    const memberPin = issued.pins.find((row) => row.role === "MEMBER")?.temporaryPin ?? "";
    const officialPin = issued.pins.find((row) => row.role === "TREASURER")?.temporaryPin ?? "";
    expect(memberPin).toMatch(/^\d{6}$/);
    expect(officialPin).toMatch(/^\d{8}$/);
    expect((await loginWithPin({ phone: "0711000222", pin: memberPin, role: "MEMBER", now })).status).toBe("authenticated");
    expect((await loginWithPin({ phone: "0711000222", pin: officialPin, role: "TREASURER", now })).status).toBe("authenticated");
    expect((await loginWithPin({ phone: "0711000222", pin: "2580", role: "TREASURER", now })).status).not.toBe("authenticated");
    const logged = await prismaRaw.auditLog.findFirst({ where: { action: "member.pin_reset" } });
    expect(JSON.stringify(logged?.after ?? {})).not.toContain(memberPin);

    const messaging = new MemoryMessagingProvider();
    const previous = process.env.OWNER_PHONE;
    process.env.OWNER_PHONE = "0712000111";
    try {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await loginWithPin({ phone: "0711000222", pin: "0000", role: "MEMBER", now, messaging });
      }
      expect(messaging.sent).toHaveLength(1);
      expect(messaging.sent[0]?.to).toBe("+254712000111");
      expect(messaging.sent[0]?.body).toContain("Tester");
      expect(messaging.sent[0]?.body).toContain("member door and the treasurer door");
      expect(messaging.sent[0]?.body).not.toContain(memberPin);
      expect((await loginWithPin({ phone: "0711000222", pin: memberPin, role: "MEMBER", now: new Date(now.getTime() + 60 * 60_000) })).status).toBe(
        "locked",
      );
      const unlocked = await unlockAccount({
        chamaId: treasurer.chama.id,
        actor: { membershipId: treasurer.membership.id, personId: treasurer.person.id, role: "TREASURER" },
        personId: treasurer.person.id,
        pin: officialPin,
      });
      expect(unlocked).toEqual({ ok: true });
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await loginWithPin({ phone: "0711000222", pin: "0000", role: "MEMBER", now, messaging });
      }
      expect(messaging.sent[1]?.body).toContain("locked again");
    } finally {
      if (previous === undefined) delete process.env.OWNER_PHONE;
      else process.env.OWNER_PHONE = previous;
    }
  });
});
