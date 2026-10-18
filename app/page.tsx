import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Preferences } from "@/components/preferences";
import { ScenePhoto } from "@/components/scene-photo";
import { brand } from "@/config/brand";
import { copy } from "@/content/ui";
import { getLocale } from "@/lib/locale";

export default async function LandingPage() {
  const locale = await getLocale();
  const text = copy(locale);
  const page = text.landing;
  const features = [
    [page.feature1, page.feature1Body],
    [page.feature2, page.feature2Body],
    [page.feature3, page.feature3Body],
  ];

  return (
    <main className="relative">
      <header className="absolute z-10 flex w-full items-center justify-between gap-3 px-5 py-4 text-white sm:px-8">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em]">
          <BrandMark />
          {brand.name}
        </p>
        <Preferences locale={locale} languageLabel={text.language} lightLabel={text.themeLight} darkLabel={text.themeDark} />
      </header>
      <ScenePhoto name="chama-meeting" alt="Six chama members reviewing papers around a wooden table" priority tall>
        <div className="max-w-3xl text-white">
          <p className="text-xs uppercase tracking-[0.16em] text-white/80">{brand.tagline}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">{page.bankHeadline}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">{page.bankSentence}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login?door=member" className="btn bg-white text-navy">
              {page.signIn}
            </Link>
            <Link href="/login?door=treasurer" className="tap rounded-lg border border-white px-5 text-sm font-semibold text-white">
              {page.forTreasurers}
            </Link>
          </div>
        </div>
      </ScenePhoto>
      <section className="mx-auto grid max-w-5xl gap-4 px-5 py-10 sm:grid-cols-3 sm:px-8">
        {features.map(([title, body]) => (
          <article key={title} className="card p-5">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </article>
        ))}
      </section>
      <footer className="mx-auto max-w-5xl border-t border-line px-5 py-8 text-sm text-muted sm:px-8">
        <p>{page.security}</p>
        <p className="mt-2">
          {brand.name} · {brand.tagline}
        </p>
      </footer>
    </main>
  );
}
