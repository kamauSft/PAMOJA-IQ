import { cookies } from "next/headers";
import { demoCodesVisible } from "../demo";
import { normalizePhone } from "../phone";
import { consumeRateLimit } from "./rate-limit";
import { SESSION_COOKIE, sessionCookieOptions, sessionLifetimeMs } from "./session";

export function demoMode(): boolean {
  return demoCodesVisible();
}

export function demoOtpVisible(): boolean {
  return demoMode();
}

/**
 * A forwarded address is only believed behind a proxy we control. Otherwise the
 * browser could pick its own address and slip past the sign-in limit.
 */
export function trustProxy(): boolean {
  const flag = process.env.TRUST_PROXY;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.VERCEL === "1";
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded && trustProxy()) return forwarded;
  return "local";
}

/** Wrong PINs are counted against the number as well as the address, so a fresh IP is no help. */
export function limitAuth(request: Request, bucket: string, phone?: string) {
  const number = phone ? (normalizePhone(phone) ?? phone.trim()) : "";
  const who = number ? `${clientIp(request)}:${number}` : clientIp(request);
  return consumeRateLimit(`${bucket}:${who}`, 20, 15 * 60 * 1000);
}

export async function setSessionCookie(token: string, role = "MEMBER") {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions(sessionLifetimeMs(role) / 1000));
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
