import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "@/lib/http/security-headers";

const NONCE = "test-nonce-value";

function scriptDirective(policy: string): string {
  return policy.split(";").find((part) => part.trim().startsWith("script-src")) ?? "";
}

describe("development stays on plain http", () => {
  it("does not force https while the app is on this computer", () => {
    const names = securityHeaders(false).map((header) => header.key);
    const policy = contentSecurityPolicy(NONCE, false);
    expect(names).not.toContain("Strict-Transport-Security");
    expect(policy).not.toContain("upgrade-insecure-requests");
    expect(scriptDirective(policy)).toContain(`'nonce-${NONCE}'`);
  });

  it("locks https only when the app is on the internet", () => {
    const names = securityHeaders(true).map((header) => header.key);
    const policy = contentSecurityPolicy(NONCE, true);
    expect(names).toContain("Strict-Transport-Security");
    expect(scriptDirective(policy)).toContain(`'nonce-${NONCE}'`);
    expect(scriptDirective(policy)).toContain("'strict-dynamic'");
    expect(scriptDirective(policy)).not.toContain("'unsafe-inline'");
    expect(policy).toContain("frame-ancestors 'none'");
  });
});
