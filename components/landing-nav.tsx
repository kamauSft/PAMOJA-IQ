"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Preferences } from "@/components/preferences";
import { brand } from "@/config/brand";
import type { Locale } from "@/content/ui";

type NavLabels = {
  proof: string;
  doors: string;
  guide: string;
  faq: string;
  contact: string;
  signIn: string;
  menu: string;
};

const LINKS: Array<
  [keyof Pick<NavLabels, "proof" | "doors" | "guide" | "faq" | "contact">, string]
> = [
  ["proof", "#proof"],
  ["doors", "#doors"],
  ["guide", "#guide"],
  ["faq", "#faq"],
  ["contact", "#contact"],
];

export function LandingNav({
  labels,
  locale,
  languageLabel,
  lightLabel,
  darkLabel,
}: {
  labels: NavLabels;
  locale: Locale;
  languageLabel: string;
  lightLabel: string;
  darkLabel: string;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b border-white/10 transition-colors duration-300 ${
        scrolled ? "bg-[#0B3D24]/95 shadow-lg backdrop-blur" : "bg-[#0B3D24]/70 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-white">
          <BrandMark className="h-7 w-7 text-[#7DDECA]" />
          <span className="hidden text-sm font-semibold uppercase tracking-[0.16em] sm:inline">
            {brand.name}
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-5 md:flex">
          {LINKS.map(([key, href]) => (
            <a key={key} href={href} className="text-sm text-white/80 transition hover:text-white">
              {labels[key]}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/login"
            className="tap hidden rounded-full bg-white px-4 text-sm font-semibold text-[#0B3D24] sm:inline-flex"
          >
            {labels.signIn}
          </Link>
          <Preferences
            locale={locale}
            languageLabel={languageLabel}
            lightLabel={lightLabel}
            darkLabel={darkLabel}
          />
          <details className="relative md:hidden">
            <summary className="tap cursor-pointer rounded-lg border border-white/30 px-3 text-[13px] font-semibold text-white">
              {labels.menu}
            </summary>
            <nav
              aria-label="Mobile"
              className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-line bg-surface p-2 shadow-xl"
            >
              {LINKS.map(([key, href]) => (
                <a
                  key={key}
                  href={href}
                  className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-canvas"
                >
                  {labels[key]}
                </a>
              ))}
              <Link
                href="/login"
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-canvas"
              >
                {labels.signIn}
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
