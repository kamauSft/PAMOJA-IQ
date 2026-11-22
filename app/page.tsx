import Link from "next/link";
import { GuideTour } from "@/components/guide-tour";
import { LandingNav } from "@/components/landing-nav";
import {
  AboutSection,
  ContactSection,
  DoorsSection,
  FaqSection,
  HowSection,
  ProofBand,
  SiteFooter,
} from "@/components/landing-sections";
import { MovingScenes } from "@/components/moving-scenes";
import { copy } from "@/content/ui";
import { getLocale } from "@/lib/locale";

export default async function LandingPage() {
  const locale = await getLocale();
  const text = copy(locale);
  const site = text.site;

  return (
    <main className="relative">
      <LandingNav
        labels={site.nav}
        locale={locale}
        languageLabel={text.language}
        lightLabel={text.themeLight}
        darkLabel={text.themeDark}
      />

      <MovingScenes
        variant="page"
        priority
        contentClassName="items-center justify-start px-5 pb-16 pt-24 sm:px-10 lg:px-16"
      >
        <div className="max-w-4xl text-white">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7DDECA]" aria-hidden="true" />
            {site.hero.eyebrow}
          </p>
          <h1 className="editorial text-balance mt-6 text-4xl font-normal leading-[1.08] sm:text-6xl lg:text-7xl">
            {site.hero.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">{site.hero.sentence}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login?door=member"
              className="btn h-auto min-h-11 rounded-full bg-white px-6 py-3 text-sm text-[#0B3D24] sm:w-auto"
            >
              {site.hero.member}
            </Link>
            <Link
              href="/login?door=treasurer"
              className="tap h-auto min-h-11 rounded-full border border-white/70 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 sm:w-auto"
            >
              {site.hero.treasurer}
            </Link>
          </div>
          <p className="mt-5 text-sm text-white/70">{site.hero.note}</p>
          <a href="#guide" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#7DDECA] hover:text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            {site.hero.watch}
          </a>
        </div>
      </MovingScenes>

      <ProofBand site={site} />
      <AboutSection site={site} />
      <HowSection site={site} />
      <DoorsSection site={site} />
      <GuideTour labels={text.guide} />
      <FaqSection site={site} />
      <ContactSection site={site} />
      <SiteFooter site={site} />
    </main>
  );
}
