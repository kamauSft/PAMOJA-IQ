import { readFileSync, writeFileSync } from "node:fs";
import { schemaForDatabaseUrl } from "../lib/database-provider";

const path = "prisma/schema.prisma";
const current = readFileSync(path, "utf8");
const next = schemaForDatabaseUrl(current, process.env.DATABASE_URL ?? "");
if (next !== current) writeFileSync(path, next);
