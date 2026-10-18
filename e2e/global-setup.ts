import { execFileSync } from "node:child_process";
import path from "node:path";

export default function globalSetup() {
  const prismaCli = path.resolve("node_modules/prisma/build/index.js");
  execFileSync(process.execPath, [prismaCli, "db", "push", "--skip-generate"], { stdio: "inherit" });
  execFileSync(process.execPath, ["scripts/ensure-demo.mjs"], { stdio: "inherit" });
  const tsxCli = path.resolve("node_modules/tsx/dist/cli.mjs");
  execFileSync(process.execPath, [tsxCli, "scripts/reset-lockout.ts"], { stdio: "inherit" });
}
