const PINS = "pamoja-public-pins";
const LOCKS = "pamoja-public-locks";
const SESSION = "pamoja-public-session";

export function canonicalPhone(input) {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (digits.length < 9) return "";
  return digits.slice(-9);
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

function weakPin(pin) {
  return /^(\d)\1+$/.test(pin) || "01234567890".includes(pin) || "9876543210".includes(pin);
}

export async function savePin(phone, pin, confirm) {
  const key = canonicalPhone(phone);
  if (!key) return { ok: false, message: "Enter a Kenyan mobile number." };
  if (!/^\d{4,6}$/.test(pin)) return { ok: false, message: "Use a PIN of 4 to 6 digits." };
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

export async function signIn(phone, pin) {
  const key = canonicalPhone(phone);
  if (!key) return { ok: false, message: "Enter a Kenyan mobile number." };
  const locks = read(LOCKS);
  const lock = locks[key];
  if (lock?.until > Date.now()) {
    return { ok: false, message: "Too many tries. Wait 15 minutes, or reset the PIN." };
  }
  const saved = read(PINS)[key];
  if (!saved) return { ok: false, message: "No PIN is set on this browser yet. Reset the PIN first." };
  if ((await digest(pin)) !== saved) {
    const fails = (lock?.fails ?? 0) + 1;
    locks[key] = fails >= 5 ? { fails: 0, until: Date.now() + 15 * 60 * 1000 } : { fails, until: 0 };
    localStorage.setItem(LOCKS, JSON.stringify(locks));
    const left = 5 - fails;
    return {
      ok: false,
      message: fails >= 5 ? "Too many tries. Wait 15 minutes, or reset the PIN." : `That phone or PIN is not right. ${left} ${left === 1 ? "try" : "tries"} left.`,
    };
  }
  delete locks[key];
  localStorage.setItem(LOCKS, JSON.stringify(locks));
  sessionStorage.setItem(SESSION, JSON.stringify({ phone: key, until: Date.now() + 8 * 60 * 60 * 1000 }));
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
