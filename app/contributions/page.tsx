import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { booksAsOf } from "@/lib/chama/clock";
import { loadDesk } from "@/lib/chama/load-desk";
import { requireSession, tenantFromSession } from "@/lib/chama/page-session";
import { isOfficial, runWithTenant } from "@/lib/tenancy/context";
import type { ContributionCell } from "@/lib/chama/picture";

export const dynamic = "force-dynamic";

const TONE: Record<ContributionCell, string> = {
  PAID: "bg-[#1e6f5c] text-white",
  LATE: "bg-[#9a6b00] text-white",
  MISSED: "bg-[#a33a2b] text-white",
  NOT_DUE: "bg-line text-ink",
};

const WORD: Record<ContributionCell, string> = {
  PAID: "Paid",
  LATE: "Late",
  MISSED: "Missed",
  NOT_DUE: "—",
};

export default async function ContributionsPage() {
  const session = await requireSession();
  if (!isOfficial(session.role)) redirect("/home");
  const desk = await runWithTenant(tenantFromSession(session), () => loadDesk(booksAsOf()));

  return (
    <Shell chamaName={desk.chamaName} personName={session.personName} role={session.role} current="/contributions">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Contributions</p>
      <h1 className="mt-1 text-4xl">Every member, every month</h1>
      <p className="mt-1 text-sm text-muted">
        {desk.period} collected {desk.collectedLabel} of {desk.expectedLabel} ({desk.collectionRateLabel}).
      </p>
      <ul className="mt-4 flex flex-wrap gap-3 text-xs">
        {(["PAID", "LATE", "MISSED", "NOT_DUE"] as const).map((cell) => (
          <li key={cell} className={`rounded-md px-3 py-1 text-[13px] ${TONE[cell]}`}>
            {WORD[cell]}
          </li>
        ))}
      </ul>
      <div className="card mt-4 overflow-x-auto">
        <table className="min-w-max text-left text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-surface px-3 py-2 font-medium">Member</th>
              {desk.periods.map((period) => (
                <th key={period} className="px-2 py-2 font-medium text-muted">
                  {period.slice(2)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {desk.grid.map((row) => (
              <tr key={row.membershipId} className="border-t border-line">
                <th className="sticky left-0 bg-surface px-3 py-2 text-left font-medium">
                  {row.memberNo} {row.name.split(" ")[0]}
                </th>
                {row.cells.map((cell, index) => (
                  <td key={desk.periods[index]} className="px-1 py-1">
                    <span className={`block rounded px-1.5 py-1 text-center ${TONE[cell]}`}>{WORD[cell]}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
