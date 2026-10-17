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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 text-ink">
          <BrandMark />
          <div>
            <p className="text-lg font-semibold leading-none">{brand.name}</p>
            <p className="mt-1 text-[13px] text-muted">{brand.tagline}</p>
          </div>
        </div>
        <Preferences locale={locale} languageLabel={text.language} lightLabel={text.themeLight} darkLabel={text.themeDark} />
      </header>
      <h1 className="mt-16 max-w-xl text-[2rem] leading-tight">{page.bankHeadline}</h1>
      <p className="mt-4 max-w-xl text-[18px] text-muted">{page.bankSentence}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/login?door=member" className="btn">
          {page.signIn}
        </Link>
        <Link href="/login?door=treasurer" className="tap rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-navy">
          {page.forTreasurers}
        </Link>
      </div>
      <ul className="mt-12 divide-y divide-line border-y border-line">
        {[page.featureUpload, page.featurePrivate, page.featureReminders].map((row) => (
          <li key={row} className="py-4 text-[15px]">
            {row}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-[13px] text-muted">{page.security}</p>
      <footer className="mt-auto pt-16 text-[13px] text-muted">
        {brand.name} · {brand.tagline}
      </footer>
    </main>
  );
}
