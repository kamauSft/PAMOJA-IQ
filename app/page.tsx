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
      <header className="absolute z-20 flex w-full items-center justify-between gap-2 px-4 py-4 text-white sm:gap-3 sm:px-8">
        <p className="flex min-w-0 items-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.12em] sm:text-sm sm:tracking-[0.18em]">
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
            <Link
              href="/login?door=member"
              className="btn h-auto w-full flex-col items-start gap-1 whitespace-normal px-5 py-4 text-left"
              style={{ flexDirection: "column", alignItems: "flex-start", height: "auto" }}
            >
              <span className="block text-base">{page.memberCta}</span>
              <span className="block text-xs font-normal leading-5 opacity-80">{page.memberHint}</span>
            </Link>
            <Link
              href="/login?door=treasurer"
              className="tap flex h-auto w-full flex-col items-start gap-1 whitespace-normal rounded-lg border border-white px-5 py-4 text-left text-sm font-semibold text-white"
              style={{ flexDirection: "column", alignItems: "flex-start", height: "auto" }}
            >
              <span className="block text-base">{page.treasurerCta}</span>
              <span className="block text-xs font-normal leading-5 text-white/80">{page.treasurerHint}</span>
            </Link>
          </div>
        </div>
      </MovingScenes>
    </main>
  );
}
