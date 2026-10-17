/** Demo codes on screen are for local practice. A production server must refuse to boot with them on. */
export function demoRequested(): boolean {
  return process.env.DEMO_MODE === "true" || process.env.DEMO_OTP_VISIBLE === "true";
}

export function demoExplicitlyAllowedInProduction(): boolean {
  return process.env.ALLOW_DEMO_IN_PROD === "true";
}

export function assertDemoSafe(): void {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NODE_ENV !== "production") return;
  if (!demoRequested()) return;
  if (demoExplicitlyAllowedInProduction()) return;
  throw new Error(
    "Refusing to start: DEMO_MODE is on and NODE_ENV is production. Turn DEMO_MODE off, or set ALLOW_DEMO_IN_PROD=true only for a deliberate demo deployment.",
  );
}

export function demoCodesVisible(): boolean {
  if (process.env.NODE_ENV === "production" && !demoExplicitlyAllowedInProduction()) return false;
  return demoRequested();
}
