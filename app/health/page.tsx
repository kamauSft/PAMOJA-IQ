import packageJson from "../../package.json";
import { prismaRaw } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  let records = "connected";
  try {
    await prismaRaw.$queryRaw`SELECT 1`;
  } catch {
    records = "not set up. Double-click start-pamoja.bat and leave that window open.";
  }
  const where = process.env.NODE_ENV === "production" ? "on the internet" : "on this computer";

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-16">
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">Pamoja IQ</p>
      <h1 className="mt-2 text-3xl font-semibold">Is it running?</h1>
      <ul className="mt-6 space-y-3 text-sm">
        <li>App: running</li>
        <li>Records: {records}</li>
        <li>Version: {packageJson.version}</li>
        <li>Where: {where}</li>
      </ul>
      <p className="mt-6 text-sm text-muted">
        On this computer the address starts with http. The browser may say Not secure. That label is normal here. A padlock appears only on the internet address.
      </p>
    </main>
  );
}
