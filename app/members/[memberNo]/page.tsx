import Link from "next/link";
import { redirect } from "next/navigation";
import { MonthPill } from "@/components/month-pill";
import { Shell } from "@/components/shell";
import { booksAsOf } from "@/lib/chama/clock";
import { requireSession, tenantFromSession } from "@/lib/chama/page-session";
import { loadMemberFile } from "@/lib/member/file";
import { membershipIdForMemberNo } from "@/lib/member/statement";
import { isOfficial, runWithTenant, TenantIsolationError } from "@/lib/tenancy/context";

export const dynamic = "force-dynamic";

export default async function MemberFilePage({ params }: { params: Promise<{ memberNo: string }> }) {
  const session = await requireSession();
  if (!isOfficial(session.role)) redirect("/home");
  const { memberNo } = await params;
  const file = await runWithTenant(tenantFromSession(session), async () => {
    const membershipId = await membershipIdForMemberNo(memberNo);
    if (!membershipId) return null;
    try {
      return await loadMemberFile(membershipId, booksAsOf());
    } catch (error) {
      if (error instanceof TenantIsolationError) return "forbidden" as const;
      throw error;
    }
  });
  if (!file || file === "forbidden") redirect("/members");

  return (
    <Shell chamaName={file.chamaName} personName={session.personName} role={session.role} current="/members">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">One member</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl">{file.personName}</h1>
          <p className="mt-1 text-sm text-muted">
            {file.memberNo} · {file.role} · {file.status} · {file.phoneMasked}
          </p>
        </div>
        <MonthPill cell={file.thisMonth} />
      </div>
      <p className="mt-3 text-sm text-muted">
        {file.periodLabel} contribution is {file.monthlyDueLabel}. The member sees these same figures, and nobody else&apos;s.
      </p>
      <h2 className="mt-8 text-2xl">Months</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {file.cells.map((cell, index) => (
          <span key={file.periods[index]} className="card px-2 py-2 text-center text-xs">
            <span className="block text-muted">{file.periods[index]}</span>
            <span className="mt-1 block"><MonthPill cell={cell} /></span>
          </span>
        ))}
      </div>
      <h2 className="mt-8 text-2xl">Loans</h2>
      {file.loans.length === 0 ? <p className="mt-2 text-sm text-muted">No loan.</p> : null}
      {file.loans.map((loan) => (
        <article key={loan.purpose} className="card mt-3 p-4 text-sm">
          <p className="font-medium text-ink">{loan.purpose} · {loan.status.toLowerCase()} · {loan.principalLabel}</p>
          <table className="mt-3 w-full text-left">
            <thead className="text-muted">
              <tr>
                <th className="py-1 font-medium">Due</th>
                <th className="py-1 font-medium">Installment</th>
                <th className="py-1 font-medium">Paid</th>
                <th className="py-1 font-medium">Left</th>
              </tr>
            </thead>
            <tbody>
              {loan.installments.map((row) => (
                <tr key={row.dueDate} className="border-t border-line">
                  <td className="py-1">{row.dueDate}</td>
                  <td>{row.dueLabel}</td>
                  <td>{row.paidLabel}</td>
                  <td>{row.remainingLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      ))}
      <h2 className="mt-8 text-2xl">Fines</h2>
      {file.fines.length === 0 ? <p className="mt-2 text-sm text-muted">No fines.</p> : null}
      <ul className="mt-2 space-y-2 text-sm">
        {file.fines.map((fine) => (
          <li key={`${fine.date}-${fine.type}`}>{fine.date} · {fine.type} · {fine.amountLabel} · {fine.status.toLowerCase()}</li>
        ))}
      </ul>
      <Link href={`/statement?memberNo=${file.memberNo}`} className="btn mt-6">
        Open statement
      </Link>
    </Shell>
  );
}
