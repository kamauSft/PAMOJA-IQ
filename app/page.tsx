import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Preferences } from "@/components/preferences";
import { brand } from "@/config/brand";
import { copy } from "@/content/ui";
import { getLocale } from "@/lib/locale";

export default async function LandingPage() {
  const locale = await getLocale();
  const text = copy(locale);
  const page = text.landing;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-leaf">
          <BrandMark />
          {brand.name}
        </p>
        <Preferences locale={locale} languageLabel={text.language} lightLabel={text.themeLight} darkLabel={text.themeDark} />
      </div>
      <p className="mt-3 text-sm text-muted">{brand.tagline}</p>
      <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-ink sm:text-5xl">{page.headline}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{page.sub}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/login?door=treasurer" className="card block p-5">
          <span className="font-display text-2xl">{page.treasurerCta}</span>
          <p className="mt-2 text-sm text-muted">{page.treasurerHint}</p>
        </Link>
        <Link href="/login?door=member" className="card block p-5">
          <span className="font-display text-2xl">{page.memberCta}</span>
          <p className="mt-2 text-sm text-muted">{page.memberHint}</p>
        </Link>
      </div>
    </main>
  );
}
