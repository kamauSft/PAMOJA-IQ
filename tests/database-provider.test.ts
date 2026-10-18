import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { schemaForDatabaseUrl } from "../lib/database-provider";

const schema = readFileSync("prisma/schema.prisma", "utf8");

describe("schemaForDatabaseUrl", () => {
  it("keeps the local file database on SQLite", () => {
    const next = schemaForDatabaseUrl(schema, "file:./dev.db");
    expect(next).toContain('provider = "sqlite"');
    expect(next).not.toContain("directUrl");
  });

  it("switches a Postgres address and keeps a direct migration address", () => {
    const next = schemaForDatabaseUrl(schema, "postgres://example.neon.tech/pamoja");
    expect(next).toContain('provider = "postgresql"');
    expect(next).toContain('directUrl = env("DATABASE_URL_UNPOOLED")');
    expect(schemaForDatabaseUrl(next, "postgres://example.neon.tech/pamoja")).toBe(next);
  });

  it("restores SQLite when the address is a local file again", () => {
    const postgres = schemaForDatabaseUrl(schema, "postgresql://example.neon.tech/pamoja");
    const local = schemaForDatabaseUrl(postgres, "file:./dev.db");
    expect(local).toContain('provider = "sqlite"');
    expect(local).not.toContain("directUrl");
  });
});
