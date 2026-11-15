import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * The browser tests need the same database address the app uses. CI supplies it
 * as an environment variable; a developer's computer keeps it in .env, which a
 * plain child process does not read by itself.
 */
export default function globalSetup() {
  if (!process.env.DATABASE_URL && existsSync(".env")) {
    process.loadEnvFile(".env");
  }
  const prismaCli = path.resolve("node_modules/prisma/build/index.js");
  execFileSync(process.execPath, [prismaCli, "db", "push", "--skip-generate"], { stdio: "inherit" });
  execFileSync(process.execPath, ["scripts/ensure-demo.mjs"], { stdio: "inherit" });
  const tsxCli = path.resolve("node_modules/tsx/dist/cli.mjs");
  execFileSync(process.execPath, [tsxCli, "scripts/reset-lockout.ts"], { stdio: "inherit" });
}
