import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Preferences } from "@/components/preferences";
import { Rise } from "@/components/rise";
import { brand } from "@/config/brand";
import { copy } from "@/content/ui";
import { monthlyPriceCents } from "@/lib/chama/picture";
import { formatKes } from "@/lib/finance";
import { getLocale } from "@/lib/locale";

const EXAMPLE_MEMBERS = 19;
const standard = formatKes(monthlyPriceCents("STANDARD", EXAMPLE_MEMBERS));
const pro = formatKes(monthlyPriceCents("PRO", EXAMPLE_MEMBERS));

export default async function LandingPage() {
  const locale = await getLocale();
  const text = copy(locale);
  const page = text.landing;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-leaf">
          <BrandMark />
          {brand.name} · {brand.demoChama}
        </p>
        <Preferences locale={locale} languageLabel={text.language} lightLabel={text.themeLight} darkLabel={text.themeDark} />
      </div>
      <p className="mt-3 text-sm text-muted">{brand.tagline}</p>
      <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-ink sm:text-5xl">{page.headline}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{page.sub}</p>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Rise className="rounded-2xl bg-leaf p-6 text-ivory shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ivory/75">{page.treasurerKicker}</p>
          <h2 className="mt-2 font-display text-3xl">Peter Otieno</h2>
          <p className="mt-3 text-sm text-ivory/90">{page.treasurerBody}</p>
          <Link href="/login?who=treasurer" className="tap mt-6 rounded-full bg-sisal px-5 text-sm font-semibold text-ink">
            {page.treasurerAction}
          </Link>
        </Rise>
        <Rise className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">{page.memberKicker}</p>
          <h2 className="mt-2 font-display text-3xl">Amina Hassan</h2>
          <p className="mt-3 text-sm text-muted">{page.memberBody}</p>
          <Link href="/login?who=member" className="tap mt-6 rounded-full bg-leaf px-5 text-sm font-semibold text-ivory">
            {page.memberAction}
          </Link>
        </Rise>
      </section>

      <p className="mt-6 text-sm text-muted">
        <Link className="font-semibold text-leaf underline" href="/start">
          {page.startCta}
        </Link>
        . {page.startBody}
      </p>
      <p className="mt-3 text-sm text-muted">
        {page.chair}{" "}
        <Link className="underline" href="/login?who=chair">
          {page.chairAction}
        </Link>
        . {page.hint}
      </p>

      <section id="price" className="mt-14">
        <h2 className="font-display text-3xl">{page.priceTitle}</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Standard is the higher of KES 500 and KES 30 an active member. Pro is the higher of KES 1,000 and KES 60. Umoja&apos;s{" "}
          {EXAMPLE_MEMBERS} active members are {standard} on Standard and {pro} on Pro.
        </p>
      </section>
      <p className="mt-10 text-sm text-muted">
        {brand.meaning} {page.questions}: {brand.supportEmail}
      </p>
    </main>
  );
}
