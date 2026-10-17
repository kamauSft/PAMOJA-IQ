import { ORIGINAL_PIN, PRACTICE_PHONE } from "./data.js";

const STORE = "pamoja-practice-pin";
const SESSION = "pamoja-practice-session";
const EIGHT_HOURS = 8 * 60 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

function readPin() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "");
    if (saved && typeof saved.pin === "string") return saved;
  } catch {
    /* a broken saved value falls back to the original practice PIN */
  }
  return { pin: ORIGINAL_PIN, fails: 0, lockedUntil: 0 };
}

function writePin(state) {
  localStorage.setItem(STORE, JSON.stringify(state));
}

export function canonicalPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits === "0707436816" || digits === "254707436816" || digits === "707436816") return PRACTICE_PHONE;
  return "";
}

export function signIn(phone, pin) {
  const state = readPin();
  const now = Date.now();
  if (state.lockedUntil > now) {
    return { ok: false, message: "Too many tries. This browser is locked for 15 minutes. You can reset the PIN." };
  }
  if (canonicalPhone(phone) !== PRACTICE_PHONE || pin !== state.pin) {
    const fails = (state.fails || 0) + 1;
    if (fails >= 5) {
      writePin({ pin: state.pin, fails: 0, lockedUntil: now + LOCK_MS });
      return { ok: false, message: "Too many tries. This browser is locked for 15 minutes. You can reset the PIN." };
    }
    writePin({ ...state, fails });
    return { ok: false, message: `That phone or PIN is not right. ${5 - fails} tries left.` };
  }
  writePin({ pin: state.pin, fails: 0, lockedUntil: 0 });
  sessionStorage.setItem(SESSION, JSON.stringify({ at: now }));
  return { ok: true };
}

export function sessionOpen() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION) || "");
    if (!saved?.at) return false;
    if (Date.now() - saved.at > EIGHT_HOURS) {
      sessionStorage.removeItem(SESSION);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function signOut() {
  sessionStorage.removeItem(SESSION);
}

export function resetPin(phone, nextPin) {
  if (canonicalPhone(phone) !== PRACTICE_PHONE) {
    return { ok: false, message: "That number is not in the practice books." };
  }
  if (!/^\d{4}$/.test(nextPin)) return { ok: false, message: "Use a 4-digit PIN." };
  writePin({ pin: nextPin, fails: 0, lockedUntil: 0 });
  return { ok: true };
}

export function restoreOriginalPin() {
  writePin({ pin: ORIGINAL_PIN, fails: 0, lockedUntil: 0 });
}
