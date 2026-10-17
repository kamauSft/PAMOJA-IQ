import Link from "next/link";
import { MemberPinForm } from "@/components/member-pin";
import { MonthPill } from "@/components/month-pill";
import { Shell } from "@/components/shell";
import { Stat } from "@/components/stat";
import { copy } from "@/content/ui";
import { booksAsOf } from "@/lib/chama/clock";
import { requireSession, tenantFromSession } from "@/lib/chama/page-session";
import { getLocale } from "@/lib/locale";
import { loadMemberHome } from "@/lib/member/home";
import { runWithTenant } from "@/lib/tenancy/context";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requireSession();
  const locale = await getLocale();
  const text = copy(locale).home;
  const pin = copy(locale).pin;
  const home = await runWithTenant(tenantFromSession(session), () =>
    loadMemberHome(session.membershipId, booksAsOf()),
  );
  const first = home.personName.split(" ")[0];
  const month =
    home.thisMonth === "PAID" || home.thisMonth === "LATE" ? text.recorded : home.thisMonth === "MISSED" ? text.missed : text.notDue;

  return (
    <Shell chamaName={home.chamaName} personName={home.personName} role={session.role} current="/home">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">{text.kicker}</p>
      <h1 className="mt-1 font-display text-4xl">
        {first}&apos;s {text.money}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        {home.memberNo} · {home.status}. {text.onlyYou} {text.books} {booksAsOf().toISOString().slice(0, 10)}.{" "}
        {home.auditIntact ? text.auditOk : text.auditBad}.
      </p>
      <section className="card mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">
              {home.periodLabel} {text.due} {home.monthlyDueLabel}
            </p>
            <p className="mt-1 font-display text-3xl">{month}</p>
          </div>
          <MonthPill cell={home.thisMonth} />
        </div>
        {home.nextInstallment ? (
          <p className="mt-4 text-sm text-muted">
            {text.nextLoan}: {home.nextInstallment.remainingLabel} · {home.nextInstallment.dueDate} · {home.nextInstallment.purpose}.
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">{text.noLoan}</p>
        )}
      </section>
      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={text.savings} value={home.savingsLabel} />
        <Stat label={text.loan} value={home.loanLabel} />
        <Stat label={text.fines} value={home.finesLabel} />
        <Stat label={text.net} value={home.netLabel} hint={`${text.arrears} ${home.arrearsLabel}`} />
      </section>
      {home.goals.length > 0 ? (
        <section className="card mt-4 p-4">
          <h2 className="font-display text-2xl">{text.goal}</h2>
          {home.goals.map((goal) => (
            <div key={goal.title} className="mt-3">
              <p className="text-sm text-muted">
                {goal.title}: {goal.savedLabel} {text.of} {goal.targetLabel}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-leaf/20">
                <div className="h-full bg-leaf" style={{ width: `${goal.progressBps / 100}%` }} />
              </div>
            </div>
          ))}
        </section>
      ) : null}
      {session.role === "MEMBER" ? <MemberPinForm labels={pin} /> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/mine" className="tap rounded-full border border-ink/20 px-4 text-sm">
          {text.months}
        </Link>
        <Link href="/loan" className="tap rounded-full border border-ink/20 px-4 text-sm">
          {text.myLoan}
        </Link>
        <Link href="/statement" className="tap rounded-full bg-leaf px-4 text-sm font-semibold text-ivory">
          {text.statement}
        </Link>
      </div>
    </Shell>
  );
}
