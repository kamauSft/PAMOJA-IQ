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
  const official = isOfficial(role);
  const links = (official ? text.shell.official : text.shell.member).filter(
    ([, href]) => (href !== "/import" && href !== "/publish") || canBringInBooks(role),
  );

  return (
    <div className={official ? "min-h-screen md:grid md:grid-cols-[15rem_1fr]" : "min-h-screen"}>
      {official ? (
        <aside className="no-print hidden border-r border-line bg-navy text-[var(--on-navy)] md:flex md:flex-col">
          <div className="flex items-center gap-2 px-4 py-5 text-sm font-semibold">
            <BrandMark className="h-7 w-7" />
            {brand.name}
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-2">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={
                  href === current
                    ? "tap justify-start rounded-lg bg-white/10 px-3 text-sm font-semibold"
                    : "tap justify-start rounded-lg px-3 text-sm text-white/80 hover:bg-white/10"
                }
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
      ) : null}
      <div className="min-w-0">
        <header className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold text-ink">
              {brand.name} · {chamaName}
            </p>
            <p className="text-[13px] text-muted">
              {personName} · {text.shell.roles[role]}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Preferences locale={locale} languageLabel={text.language} lightLabel={text.themeLight} darkLabel={text.themeDark} />
            <SignOut signOutLabel={text.shell.signOut} signOutAllLabel={text.shell.signOutAll} />
          </div>
        </header>
        {official ? (
          <nav className="no-print flex gap-2 overflow-x-auto border-b border-line bg-surface px-3 py-2 md:hidden">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={
                  href === current
                    ? "tap shrink-0 rounded-lg bg-navy px-3 text-[13px] font-semibold text-[var(--on-navy)]"
                    : "tap shrink-0 rounded-lg border border-line px-3 text-[13px]"
                }
              >
                {label}
              </Link>
            ))}
          </nav>
        ) : null}
        <main className={official ? "px-4 py-6 sm:px-6" : "px-4 py-6 pb-24 sm:px-6"}>{children}</main>
        {official ? null : (
          <nav className="no-print fixed inset-x-0 bottom-0 flex border-t border-line bg-surface">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={
                  href === current
                    ? "tap flex-1 text-[13px] font-semibold text-accent"
                    : "tap flex-1 text-[13px] text-muted"
                }
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
