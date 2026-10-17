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
import { shortMonth } from "@/lib/member/stats";
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
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">{text.position}</p>
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
      {home.shareLabel ? (
        <p className="mt-3 text-sm text-muted">
          {home.savingsLabel} · {home.shareLabel} {text.share}
        </p>
      ) : null}
      <section className="card mt-4 p-4">
        <h2 className="font-display text-2xl">{text.track}</h2>
        <p className="mt-1 font-display text-3xl">
          {home.streak === 0
            ? text.streakFresh
            : home.streak === 1
              ? `1 ${text.streakOne}`
              : `${home.streak} ${text.streakMonths}`}
        </p>
        <p className="mt-4 text-sm text-muted">{text.growth}</p>
        <div className="mt-3 flex h-16 items-end gap-1">
          {home.bars.map((bar) => (
            <div
              key={bar.period}
              className="min-w-0 flex-1 rounded-sm bg-leaf"
              style={{ height: bar.height === 0 ? "0%" : `${Math.max(bar.height, 8)}%` }}
              title={`${shortMonth(bar.period, locale)} ${bar.label}`}
            />
          ))}
        </div>
        <ol className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-12">
          {home.months.map((month) => (
            <li key={month.period} className="text-center">
              <span
                className={`mx-auto block h-3 w-3 rounded-full ${
                  month.cell === "PAID"
                    ? "bg-leaf"
                    : month.cell === "LATE"
                      ? "bg-sisal"
                      : month.cell === "MISSED"
                        ? "bg-clay"
                        : "bg-ink/15"
                }`}
              />
              <span className="mt-1 block text-[10px] text-muted">{shortMonth(month.period, locale)}</span>
              <span className="sr-only">{text.mark[month.cell]}</span>
            </li>
          ))}
        </ol>
        <ul className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
          {(["PAID", "LATE", "MISSED", "NOT_DUE"] as const).map((cell) => (
            <li key={cell} className="flex items-center gap-1">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  cell === "PAID" ? "bg-leaf" : cell === "LATE" ? "bg-sisal" : cell === "MISSED" ? "bg-clay" : "bg-ink/15"
                }`}
              />
              {text.mark[cell]}
            </li>
          ))}
        </ul>
      </section>
      <section className="card mt-4 p-4">
        <h2 className="font-display text-2xl">{text.borrowTitle}</h2>
        <p className="mt-1 font-display text-3xl tabular-nums">{home.borrowLabel}</p>
        <p className="mt-2 text-sm text-muted">{text.borrowRule}</p>
        {home.oneLoan ? <p className="mt-1 text-sm text-muted">{text.oneLoan}</p> : null}
      </section>
      {home.group ? (
        <section className="card mt-4 p-4">
          <h2 className="font-display text-2xl">{text.groupTitle}</h2>
          <p className="mt-1 text-sm text-muted">{text.groupBody}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Stat label={text.groupSavings} value={home.group.savingsLabel} />
            <Stat label={text.groupLoans} value={home.group.loansLabel} />
            {home.group.onTimeLabel ? <Stat label={text.groupOnTime} value={home.group.onTimeLabel} /> : null}
          </div>
        </section>
      ) : null}
      <section className="card mt-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl">{text.goal}</h2>
          {session.role === "MEMBER" ? (
            <Link href="/goals" className="text-sm font-semibold text-leaf underline">
              {text.setGoal}
            </Link>
          ) : null}
        </div>
        {home.goals.slice(0, 2).map((goal) => (
          <div key={goal.id} className="mt-3">
            <p className="text-sm text-muted">
              {goal.title}: {goal.savedLabel} {text.of} {goal.targetLabel} · {text.pace[goal.pace]}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-leaf/20">
              <div className="h-full bg-leaf" style={{ width: `${goal.percent}%` }} />
            </div>
          </div>
        ))}
      </section>
      {session.role === "MEMBER" ? <MemberPinForm labels={pin} /> : null}
    </Shell>
  );
}
