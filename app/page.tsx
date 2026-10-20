import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { MovingScenes } from "@/components/moving-scenes";
import { Preferences } from "@/components/preferences";
import { brand } from "@/config/brand";
import { copy } from "@/content/ui";
import { getLocale } from "@/lib/locale";

export default async function LandingPage() {
  const locale = await getLocale();
  const text = copy(locale);
  const page = text.landing;

  return (
    <main className="relative">
      <header className="absolute z-10 flex w-full items-center justify-between gap-3 px-5 py-4 text-white sm:px-8">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em]">
          <BrandMark />
          {brand.name}
        </p>
        <Preferences locale={locale} languageLabel={text.language} lightLabel={text.themeLight} darkLabel={text.themeDark} />
      </header>
      <MovingScenes>
        <div className="max-w-3xl text-white">
          <p className="text-xs uppercase tracking-[0.16em] text-white/80">{brand.tagline}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">{page.bankHeadline}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">{page.bankSentence}</p>
          <p className="mt-3 max-w-2xl text-sm text-white/80">{page.excelLine}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href="/login?door=member" className="btn">
              <span className="block">{page.memberCta}</span>
              <span className="mt-1 block text-xs font-normal opacity-80">{page.memberHint}</span>
            </Link>
            <Link href="/login?door=treasurer" className="tap rounded-lg border border-white px-5 py-3 text-sm font-semibold text-white">
              <span className="block">{page.treasurerCta}</span>
              <span className="mt-1 block text-xs font-normal text-white/80">{page.treasurerHint}</span>
            </Link>
          </div>
        </div>
      </MovingScenes>
      <footer className="mx-auto max-w-5xl px-5 py-8 text-sm text-muted sm:px-8">
        <p>{page.security}</p>
      </footer>
    </main>
  );
}
