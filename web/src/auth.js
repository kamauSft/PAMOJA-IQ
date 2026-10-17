import { PRACTICE_PHONE } from "./data.js";

const PIN_HASH = "8eebb0799014a38852ffad12b8ba8c3fad326e1b92f83a01549c4e69b0bb9893";
const STORE = "pamoja-practice-pin";
const SESSION = "pamoja-practice-session";
const EIGHT_HOURS = 8 * 60 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "");
    if (saved && typeof saved.hash === "string") return saved;
  } catch {
    /* fall through to the original practice PIN */
  }
  return { hash: PIN_HASH, fails: 0, lockedUntil: 0 };
}

function writeState(state) {
  localStorage.setItem(STORE, JSON.stringify(state));
}

export function canonicalPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits === "0707436816" || digits === "254707436816" || digits === "707436816") return PRACTICE_PHONE;
  return "";
}

export async function signIn(phone, pin) {
  const state = readState();
  const now = Date.now();
  if (state.lockedUntil > now) {
    return { ok: false, message: "Too many tries. This browser is locked for 15 minutes. You can reset the PIN." };
  }
  const hash = await digest(pin);
  if (canonicalPhone(phone) !== PRACTICE_PHONE || hash !== state.hash) {
    const fails = (state.fails || 0) + 1;
    if (fails >= 5) {
      writeState({ hash: state.hash, fails: 0, lockedUntil: now + LOCK_MS });
      return { ok: false, message: "Too many tries. This browser is locked for 15 minutes. You can reset the PIN." };
    }
    writeState({ ...state, fails });
    return { ok: false, message: `That phone or PIN is not right. ${5 - fails} tries left.` };
  }
  writeState({ hash: state.hash, fails: 0, lockedUntil: 0 });
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

export async function resetPin(phone, nextPin) {
  if (canonicalPhone(phone) !== PRACTICE_PHONE) {
    return { ok: false, message: "That number is not in the practice books." };
  }
  if (!/^\d{4}$/.test(nextPin)) return { ok: false, message: "Use a 4-digit PIN." };
  writeState({ hash: await digest(nextPin), fails: 0, lockedUntil: 0 });
  return { ok: true };
}

export function restoreOriginalPin() {
  writeState({ hash: PIN_HASH, fails: 0, lockedUntil: 0 });
}
