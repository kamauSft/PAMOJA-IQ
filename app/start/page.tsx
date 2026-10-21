import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Preferences } from "@/components/preferences";
import { StartForm } from "@/components/start-form";
import { brand } from "@/config/brand";
import { copy } from "@/content/ui";
import { getLocale } from "@/lib/locale";

export default async function StartPage() {
  const locale = await getLocale();
  const text = copy(locale);
  const page = text.start;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-leaf">
          <BrandMark />
          {brand.name}
        </p>
        <Preferences locale={locale} languageLabel={text.language} lightLabel={text.themeLight} darkLabel={text.themeDark} />
      </div>
      <h1 className="mt-4 font-display text-4xl">{page.title}</h1>
      <p className="mt-2 text-sm text-muted">{page.body}</p>
      <div className="mt-6">
        <StartForm labels={page} />
      </div>
      <p className="mt-6 text-sm text-muted">
        <Link className="underline" href="/">
          {page.signIn}
        </Link>
      </p>
    </main>
  );
}
