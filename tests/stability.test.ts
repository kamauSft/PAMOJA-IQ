import { describe, expect, it } from "vitest";
import { securityHeaders } from "@/lib/http/security-headers";

describe("development stays on plain http", () => {
  it("does not force https while the app is on this computer", () => {
    const names = securityHeaders(false).map((header) => header.key);
    const policy = securityHeaders(false).find((header) => header.key === "Content-Security-Policy")?.value ?? "";
    expect(names).not.toContain("Strict-Transport-Security");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });

  it("locks https only when the app is on the internet", () => {
    const names = securityHeaders(true).map((header) => header.key);
    const policy = securityHeaders(true).find((header) => header.key === "Content-Security-Policy")?.value ?? "";
    expect(names).toContain("Strict-Transport-Security");
    expect(policy).toContain("script-src 'self' 'unsafe-inline'");
  });
});
