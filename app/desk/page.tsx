import Link from "next/link";
import { redirect } from "next/navigation";
import { AddMemberForm } from "@/components/add-member-form";
import { MemberRegister } from "@/components/member-register";
import { MonthPill } from "@/components/month-pill";
import { ScenePhoto } from "@/components/scene-photo";
import { Shell } from "@/components/shell";
import { Stat } from "@/components/stat";
import { copy } from "@/content/ui";
import { booksAsOf } from "@/lib/chama/clock";
import { loadDesk } from "@/lib/chama/load-desk";
import { canBringInBooks, requireSession, tenantFromSession } from "@/lib/chama/page-session";
import { getLocale } from "@/lib/locale";
import { isOfficial, runWithTenant } from "@/lib/tenancy/context";

export const dynamic = "force-dynamic";

const ORDER = { MISSED: 0, LATE: 1, PAID: 2, NOT_DUE: 3 };

export default async function DeskPage() {
  const session = await requireSession();
  if (!isOfficial(session.role)) redirect("/home");
  const locale = await getLocale();
  const text = copy(locale);
  const deskText = text.desk;
  const desk = await runWithTenant(tenantFromSession(session), () => loadDesk(booksAsOf()));
  const register = [...desk.members].sort(
    (a, b) => ORDER[a.thisMonth] - ORDER[b.thisMonth] || a.memberNo.localeCompare(b.memberNo),
  );

  return (
    <Shell chamaName={desk.chamaName} personName={session.personName} role={session.role} current="/desk">
      <ScenePhoto name="treasurer-desk" alt="A treasurer comparing a handwritten register with a laptop">
        <p className="text-2xl font-semibold text-white">{desk.chamaName}</p>
      </ScenePhoto>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-leaf">{deskText.kicker}</p>
      <h1 className="mt-1 font-display text-4xl">
        {desk.periodLabel} {deskText.meeting}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        {deskText.books} {desk.asOf}. {desk.auditIntact ? text.home.auditOk : text.home.auditBad}.{" "}
        {desk.monthTally.PAID} {deskText.paidWord} · {desk.monthTally.LATE} {deskText.lateWord} · {desk.monthTally.MISSED}{" "}
        {deskText.missedWord}.
      </p>
      {canBringInBooks(session.role) ? (
        <section className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <h2 className="font-display text-2xl">{text.upload.title}</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">{deskText.uploadBody}</p>
            <p className="mt-2 text-sm text-muted">
              {desk.latestImport
                ? `${deskText.updated} ${desk.latestImport.fileName} ${deskText.updatedOn} ${desk.latestImport.whenLabel}.`
                : deskText.noFile}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/import" className="btn">
              {text.upload.title}
            </Link>
            <Link href="/publish" className="btn">
              {text.publish.title}
            </Link>
          </div>
        </section>
      ) : null}
      {canBringInBooks(session.role) ? <AddMemberForm labels={deskText} /> : null}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={deskText.savings} value={desk.savingsLabel} />
        <Stat label={deskText.loans} value={desk.loansOutstandingLabel} />
        <Stat label={deskText.safe} value={desk.poolLabel} hint={`${deskText.reserve} ${desk.reserveLabel}`} />
        <Stat
          label={deskText.collected}
          value={desk.collectionRateLabel}
          hint={`${desk.collectedLabel} ${deskText.of} ${desk.expectedLabel}`}
        />
      </section>
      <MemberRegister
        members={register}
        periodLabel={desk.periodLabel}
        labels={{
          member: deskText.members,
          savings: text.home.savings,
          loan: text.home.loan,
          arrears: text.home.arrears,
          mark: text.home.mark,
        }}
      />
      <section className="card mt-8 p-4">
        <h2 className="text-2xl">{deskText.reminders}</h2>
        {desk.behind.length === 0 ? <p className="mt-3 text-sm text-muted">{deskText.nobodyBehind}</p> : null}
        <ul className="mt-3 space-y-2 text-sm">
          {desk.behind.map((row) => (
            <li key={row.membershipId}>
              {row.name}: {desk.periodLabel} {text.home.missed}. {text.home.arrears} {row.arrearsLabel}.
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <article className="card p-4">
          <h2 className="font-display text-2xl">{deskText.chase}</h2>
          {desk.behind.length === 0 ? <p className="mt-3 text-sm text-muted">{deskText.nobodyBehind}</p> : null}
          <ul className="mt-3 space-y-3">
            {desk.behind.map((row) => (
              <li key={row.membershipId} className="border-t border-ink/10 pt-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link className="font-medium underline" href={`/members/${row.memberNo}`}>
                    {row.memberNo} {row.name}
                  </Link>
                  <MonthPill cell={row.thisMonth} label={text.home.mark[row.thisMonth]} />
                </div>
                <p className="mt-1 text-muted">
                  {text.home.arrears} {row.arrearsLabel} · {text.home.fines} {row.finesLabel} · {deskText.overdueLoan}{" "}
                  {row.overdueLoanLabel}
                </p>
              </li>
            ))}
          </ul>
        </article>
        <article className="card p-4">
          <h2 className="font-display text-2xl">{deskText.receipts}</h2>
          {desk.receipts.length === 0 ? <p className="mt-3 text-sm text-muted">{deskText.noReceipts}</p> : null}
          <ul className="mt-3 space-y-3">
            {desk.receipts.map((receipt) => (
              <li key={receipt.transId} className="border-t border-ink/10 pt-3 text-sm">
                <p className="font-medium">
                  {receipt.amountLabel} · {receipt.transId}
                </p>
                <p className="text-muted">
                  {receipt.phoneMasked} · {receipt.billRef}
                </p>
              </li>
            ))}
          </ul>
          <Link href="/receipts" className="mt-4 inline-block text-sm font-semibold text-leaf underline">
            {deskText.openReceipts}
          </Link>
        </article>
      </section>
    </Shell>
  );
}
