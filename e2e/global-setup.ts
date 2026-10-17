import { execFileSync } from "node:child_process";
import path from "node:path";

export default function globalSetup() {
  const tsxCli = path.resolve("node_modules/tsx/dist/cli.mjs");
  execFileSync(process.execPath, [tsxCli, "scripts/reset-lockout.ts"], { stdio: "inherit" });
}
