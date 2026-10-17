import { redirect } from "next/navigation";
import { GoalForm } from "@/components/goal-form";
import { Shell } from "@/components/shell";
import { copy } from "@/content/ui";
import { booksAsOf } from "@/lib/chama/clock";
import { requireSession, tenantFromSession } from "@/lib/chama/page-session";
import { getLocale } from "@/lib/locale";
import { loadMemberHome } from "@/lib/member/home";
import { runWithTenant } from "@/lib/tenancy/context";

export const dynamic = "force-dynamic";

const paceClass = {
  reached: "text-leaf",
  on_track: "text-leaf",
  slightly_behind: "text-sisal",
  behind: "text-clay",
} as const;

export default async function GoalsPage() {
  const session = await requireSession();
  if (session.role !== "MEMBER") redirect("/desk");
  const locale = await getLocale();
  const text = copy(locale);
  const page = text.goals;
  const home = await runWithTenant(tenantFromSession(session), () => loadMemberHome(session.membershipId, booksAsOf()));

  return (
    <Shell chamaName={home.chamaName} personName={home.personName} role={session.role} current="/goals">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">{page.kicker}</p>
      <h1 className="mt-1 font-display text-4xl">{page.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        {page.body} {page.savings} {home.savingsLabel}.
      </p>
      <div className="mt-6 grid gap-4">
        {home.goals.map((goal) => (
          <article key={goal.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl">{goal.title}</h2>
              <p className={`text-sm font-semibold ${paceClass[goal.pace]}`}>{page.pace[goal.pace]}</p>
            </div>
            <p className="mt-2 text-sm text-muted">
              {goal.savedLabel} {text.home.of} {goal.targetLabel} · {goal.percent}%
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-leaf/20">
              <div className="h-full bg-leaf" style={{ width: `${goal.percent}%` }} />
            </div>
            <div className="mt-4">
              <GoalForm
                labels={page}
                goal={{
                  id: goal.id,
                  title: goal.title,
                  targetShillings: goal.targetShillings,
                  targetDate: goal.targetDate,
                }}
              />
            </div>
          </article>
        ))}
      </div>
      <div className="mt-6">
        <GoalForm labels={page} />
      </div>
    </Shell>
  );
}
