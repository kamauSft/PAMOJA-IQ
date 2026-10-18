import type { MembershipRole } from "@prisma/client";

const WEAK = new Set([
  "000000",
  "111111",
  "123456",
  "654321",
  "258025",
  "00000000",
  "11111111",
  "12345678",
  "87654321",
  "25802580",
]);

export function pinLength(role: MembershipRole): 6 | 8 {
  return role === "MEMBER" ? 6 : 8;
}

export function validatePin(pin: string, role: MembershipRole): string | null {
  const length = pinLength(role);
  if (!new RegExp(`^\\d{${length}}$`).test(pin)) {
    return role === "MEMBER" ? "Use a 6-digit PIN." : "Use an 8-digit PIN.";
  }
  if (WEAK.has(pin) || /^(\d)\1+$/.test(pin)) {
    return "Choose a PIN that is not easy to guess.";
  }
  return null;
}

export function pinMaterial(pin: string): string {
  const pepper = process.env.PIN_PEPPER?.trim();
  return pepper ? `${pepper}:${pin}` : pin;
}
