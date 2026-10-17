import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";
import { brand } from "@/config/brand";

describe("health", () => {
  it("reports the app name, version, and a reachable database", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; name: string; version: string; db: boolean };
    expect(body).toMatchObject({ ok: true, name: brand.name, db: true });
    expect(body.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
