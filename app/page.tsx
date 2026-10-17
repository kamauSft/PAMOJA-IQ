import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Preferences } from "@/components/preferences";
import { Rise } from "@/components/rise";
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
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/start" className="tap rounded-full bg-sisal px-5 text-sm font-semibold text-ink">
          {page.startCta}
        </Link>
        <Link href="/login" className="tap rounded-full bg-leaf px-5 text-sm font-semibold text-ivory">
          {page.signIn}
        </Link>
      </div>
      <Rise className="card mt-12 p-6">
        <h2 className="font-display text-3xl">{page.howTitle}</h2>
        <p className="mt-3 max-w-2xl text-muted">{page.howBody}</p>
      </Rise>
      <section id="price" className="mt-12">
        <h2 className="font-display text-3xl">{page.priceTitle}</h2>
        <p className="mt-2 max-w-2xl text-muted">{page.priceBody}</p>
      </section>
    </main>
  );
}
