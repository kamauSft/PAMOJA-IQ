import Link from "next/link";
import { brand } from "@/config/brand";
import { copy } from "@/content/ui";
import { getLocale } from "@/lib/locale";
import { canBringInBooks } from "@/lib/chama/page-session";
import { isOfficial } from "@/lib/tenancy/context";
import { BrandMark } from "./brand-mark";
import { Preferences } from "./preferences";
import { SignOut } from "./sign-out";

export async function Shell({
  chamaName,
  personName,
  role,
  current,
  children,
}: {
  chamaName: string;
  personName: string;
  role: "CHAIR" | "TREASURER" | "SECRETARY" | "MEMBER" | "AUDITOR";
  current: string;
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const text = copy(locale);
  const links = (isOfficial(role) ? text.shell.official : text.shell.member).filter(
    ([, href]) => (href !== "/import" && href !== "/publish") || canBringInBooks(role),
  );
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6">
      <header className="no-print flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-leaf">
            <BrandMark className="h-6 w-6" />
            {brand.name} · {chamaName}
          </p>
          <p className="mt-1 text-sm text-muted">
            {personName} · {text.shell.roles[role]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Preferences locale={locale} languageLabel={text.language} lightLabel={text.themeLight} darkLabel={text.themeDark} />
          <SignOut signOutLabel={text.shell.signOut} signOutAllLabel={text.shell.signOutAll} />
        </div>
      </header>
      <nav className="no-print mt-4 flex flex-wrap gap-2">
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className={
              href === current
                ? "tap rounded-full bg-leaf px-4 text-sm font-semibold text-ivory"
                : "tap rounded-full border border-ink/15 bg-paper px-4 text-sm text-ink"
            }
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
