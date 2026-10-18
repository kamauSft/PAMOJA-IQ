import { redirect } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { Shell } from "@/components/shell";
import { copy } from "@/content/ui";
import { requireSession, tenantFromSession } from "@/lib/chama/page-session";
import { getLocale } from "@/lib/locale";
import { statementShareText } from "@/lib/member/stats";
import { loadStatement, membershipIdForMemberNo } from "@/lib/member/statement";
import { runWithTenant, TenantIsolationError } from "@/lib/tenancy/context";

export const dynamic = "force-dynamic";

export default async function StatementPage({
  searchParams,
}: {
  searchParams: Promise<{ memberNo?: string }>;
}) {
  const session = await requireSession();
  if (session.role === "MEMBER") redirect("/home");
  const locale = await getLocale();
  const text = copy(locale).statement;
  const query = await searchParams;
  const statement = await runWithTenant(tenantFromSession(session), async () => {
    const membershipId = query.memberNo
      ? await membershipIdForMemberNo(query.memberNo)
      : session.membershipId;
    if (!membershipId) return null;
    try {
      return await loadStatement(membershipId);
    } catch (error) {
      if (error instanceof TenantIsolationError) return "forbidden" as const;
      throw error;
    }
  });
  if (statement === "forbidden" || statement === null) redirect("/home");
  const share = statement.closing
    ? statementShareText({
        personName: statement.personName,
        chamaName: statement.chamaName,
        lines: [
          { label: text.savings, value: statement.closing.savingsLabel },
          { label: text.loan, value: statement.closing.loanLabel },
          { label: text.fines, value: statement.closing.finesLabel },
          { label: text.net, value: statement.closing.netLabel },
        ],
      })
    : null;

  return (
    <Shell chamaName={statement.chamaName} personName={session.personName} role={session.role} current="/statement">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">{text.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {statement.memberNo} · {statement.personName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {share ? (
            <a
              className="btn"
              href={`https://wa.me/?text=${encodeURIComponent(share)}`}
              rel="noreferrer"
              target="_blank"
            >
              {text.share}
            </a>
          ) : null}
          <PrintButton label={text.print} />
        </div>
      </div>
      {statement.lines.length === 0 ? <p className="mt-6 text-sm text-muted">{text.empty}</p> : null}
      <table className="mt-6 w-full text-left text-sm">
        <thead className="text-muted">
          <tr>
            <th className="py-2 font-medium">{text.date}</th>
            <th className="py-2 font-medium">{text.entry}</th>
            <th className="py-2 font-medium">{text.savings}</th>
            <th className="py-2 font-medium">{text.loan}</th>
            <th className="py-2 font-medium">{text.fines}</th>
          </tr>
        </thead>
        <tbody>
          {statement.lines.map((line, index) => (
            <tr key={`${line.date}-${index}`} className="border-t border-ink/10">
              <td className="py-2">{line.date}</td>
              <td>{line.description}</td>
              <td className="tabular-nums">{line.savingsLabel}</td>
              <td className="tabular-nums">{line.loanLabel}</td>
              <td className="tabular-nums">{line.finesLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
