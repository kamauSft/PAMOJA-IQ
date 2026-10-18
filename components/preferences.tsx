"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/content/ui";

export function Preferences({
  locale,
  languageLabel,
  lightLabel,
  darkLabel,
}: {
  locale: Locale;
  languageLabel: string;
  lightLabel: string;
  darkLabel: string;
}) {
  const router = useRouter();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function setLocale(next: Locale) {
    document.cookie = `locale=${next};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  }

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <button
        className="tap rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink"
        type="button"
        onClick={() => setLocale(locale === "en" ? "sw" : "en")}
      >
        {languageLabel}
      </button>
      <button
        className="tap rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink"
        type="button"
        onClick={toggleTheme}
      >
        {dark ? lightLabel : darkLabel}
      </button>
    </div>
  );
}
