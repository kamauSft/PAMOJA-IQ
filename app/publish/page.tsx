import { redirect } from "next/navigation";
import { PublishButton } from "@/components/publish-button";
import { Shell } from "@/components/shell";
import { copy } from "@/content/ui";
import { canBringInBooks, requireSession } from "@/lib/chama/page-session";
import { loadPositions } from "@/lib/chama/publish";
import { prismaRaw } from "@/lib/db";
import { getLocale } from "@/lib/locale";
import { isOfficial } from "@/lib/tenancy/context";

export const dynamic = "force-dynamic";

export default async function PublishPage() {
  const session = await requireSession();
  if (!isOfficial(session.role)) redirect("/home");
  if (!canBringInBooks(session.role)) redirect("/desk");
  const [chama, positions] = await Promise.all([
    prismaRaw.chama.findUnique({ where: { id: session.chamaId } }),
    loadPositions(session.chamaId),
  ]);
  const locale = await getLocale();
  const page = copy(locale).publish;

  return (
    <Shell chamaName={chama?.name ?? "Chama"} personName={session.personName} role={session.role} current="/publish">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">{page.kicker}</p>
      <h1 className="mt-1 font-display text-4xl">{page.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{page.body}</p>
      <p className="mt-4 text-sm">
        {page.waiting}: {positions.waiting}
      </p>
      <div className="mt-4">
        <PublishButton
          label={page.action}
          working={page.working}
          done={page.done}
          already={page.already}
          disabled={positions.waiting === 0}
        />
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 font-medium">{page.member}</th>
              <th className="py-2 font-medium">{page.now}</th>
              <th className="py-2 font-medium">{page.after}</th>
            </tr>
          </thead>
          <tbody>
            {positions.members.map((member) => (
              <tr key={member.memberNo} className="border-t border-ink/10">
                <td className="py-2">
                  {member.memberNo} {member.name}
                </td>
                <td className="py-2 font-mono">{member.nowLabel}</td>
                <td className="py-2 font-mono">{member.afterLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
