const PINS = "pamoja-public-pins";
const LOCKS = "pamoja-public-locks";
const SESSION = "pamoja-public-session";

export function canonicalPhone(input) {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (digits.length < 9) return "";
  return digits.slice(-9);
}

export function isTreasurerSession() {
  const session = currentSession();
  return Boolean(session && session.door === "treasurer");
}

export async function digest(pin) {
  const bytes = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buf)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function digitsPin(pin) {
  return String(pin ?? "").replace(/\D/g, "");
}

function weakPin(pin) {
  return /^(\d)\1+$/.test(pin) || "0123456789".includes(pin) || "9876543210".includes(pin);
}

export async function savePin(phone, pin, confirm) {
  const key = canonicalPhone(phone);
  pin = digitsPin(pin);
  confirm = digitsPin(confirm);
  if (!key) return { ok: false, message: "Enter a Kenyan mobile number." };
  if (!/^\d{4,8}$/.test(pin)) return { ok: false, message: "Use a PIN of 4 to 8 digits." };
  if (pin !== confirm) return { ok: false, message: "The two PINs do not match." };
  if (weakPin(pin)) return { ok: false, message: "Choose a PIN that is not a simple sequence." };
  const pins = read(PINS);
  pins[key] = await digest(pin);
  localStorage.setItem(PINS, JSON.stringify(pins));
  const locks = read(LOCKS);
  delete locks[key];
  localStorage.setItem(LOCKS, JSON.stringify(locks));
  return { ok: true };
}

export async function signIn(phone, pin, door) {
  const key = canonicalPhone(phone);
  const entered = digitsPin(pin);
  if (!key) return { ok: false, message: "Enter a Kenyan mobile number." };
  const locks = read(LOCKS);
  const lock = locks[key];
  const pins = read(PINS);
  const stored = pins[key] || "";
  const enteredHash = await digest(entered);
  if (lock?.until > Date.now()) {
    return { ok: false, message: "Too many tries. Wait 15 minutes, then try the PIN again." };
  }
  if (!stored) return { ok: false, message: "Ask your treasurer to set your PIN." };
  if (enteredHash !== stored) {
    const fails = (lock?.fails ?? 0) + 1;
    locks[key] = fails >= 5 ? { fails: 0, until: Date.now() + 15 * 60 * 1000 } : { fails, until: 0 };
    localStorage.setItem(LOCKS, JSON.stringify(locks));
    const left = 5 - fails;
    return {
      ok: false,
      message: fails >= 5 ? "Too many tries. Wait 15 minutes, then try the PIN again." : `That phone or PIN is not right. ${left} ${left === 1 ? "try" : "tries"} left.`,
    };
  }
  delete locks[key];
  localStorage.setItem(LOCKS, JSON.stringify(locks));
  sessionStorage.setItem(SESSION, JSON.stringify({ phone: key, door, until: Date.now() + 8 * 60 * 60 * 1000 }));
  return { ok: true };
}

export function currentSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION) || "null");
    if (!value || value.until < Date.now()) return null;
    return value;
  } catch {
    return null;
  }
}

export function signOut() {
  sessionStorage.removeItem(SESSION);
}
