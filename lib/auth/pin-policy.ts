import { randomInt } from "node:crypto";

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

export function validatePin(pin: string, kind: "MEMBER" | "OFFICIAL"): string | null {
  const length = kind === "MEMBER" ? 6 : 8;
  if (!new RegExp(`^\\d{${length}}$`).test(pin)) {
    return kind === "MEMBER" ? "A member PIN is 6 digits." : "An official PIN is 8 digits.";
  }
  if (WEAK.has(pin) || /^(\d)\1+$/.test(pin)) return "Choose a PIN that is not easy to guess.";
  return null;
}

export function randomMemberPin(): string {
  let pin = "482916";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    pin = randomInt(0, 1_000_000).toString().padStart(6, "0");
    if (!validatePin(pin, "MEMBER")) return pin;
  }
  return "482916";
}
