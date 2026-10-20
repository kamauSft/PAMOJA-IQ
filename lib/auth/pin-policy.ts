import { randomInt } from "node:crypto";

const UPPERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERS = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SPECIALS = "!@#$%&*";

function pick(chars: string): string {
  return chars[randomInt(0, chars.length)] ?? "A";
}

/** At least 8 characters, with a letter, a capital, a number, and 2 special characters. */
export function validatePin(pin: string, _kind?: "MEMBER" | "OFFICIAL"): string | null {
  if (pin.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(pin)) return "Include a letter.";
  if (!/[A-Z]/.test(pin)) return "Include a capital letter.";
  if (!/\d/.test(pin)) return "Include a number.";
  if ((pin.match(/[^A-Za-z0-9]/g) ?? []).length < 2) return "Include 2 special characters.";
  return null;
}

export function acceptsStoredPin(pin: string): boolean {
  return /^(?:\d{4}|\d{6}|\d{8})$/.test(pin) || validatePin(pin) === null;
}

export function randomPassword(): string {
  const chars = [
    pick(UPPERS),
    pick(LOWERS),
    pick(DIGITS),
    pick(SPECIALS),
    pick(SPECIALS),
    pick(LOWERS),
    pick(UPPERS),
    pick(LOWERS),
  ];
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomInt(0, index + 1);
    const current = chars[index];
    chars[index] = chars[swap] ?? current;
    chars[swap] = current;
  }
  const pin = chars.join("");
  return validatePin(pin) === null ? pin : "Kw3!@mja";
}

export function randomOfficialPin(): string {
  return randomPassword();
}

export function randomMemberPin(): string {
  return randomPassword();
}
