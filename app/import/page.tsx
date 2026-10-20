import Link from "next/link";
import { redirect } from "next/navigation";
import { ImportForm } from "@/components/import-form";
import { Shell } from "@/components/shell";
import { copy } from "@/content/ui";
import { canBringInBooks, requireSession } from "@/lib/chama/page-session";
import { prismaRaw } from "@/lib/db";
import { getLocale } from "@/lib/locale";
import { isOfficial } from "@/lib/tenancy/context";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const session = await requireSession();
  if (!isOfficial(session.role)) redirect("/home");
  if (!canBringInBooks(session.role)) redirect("/desk");
  const chama = await prismaRaw.chama.findUnique({ where: { id: session.chamaId } });
  const locale = await getLocale();
  const text = copy(locale);
  const page = text.upload;

  return (
    <Shell chamaName={chama?.name ?? "Chama"} personName={session.personName} role={session.role} current="/import">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{page.kicker}</p>
      <h1 className="mt-1 text-4xl">{page.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{page.body}</p>
      <p className="mt-4">
        <Link className="text-sm font-semibold text-leaf underline" href="/api/import/template">
          {page.download}
        </Link>
      </p>
      <ImportForm labels={page} />
    </Shell>
  );
}
