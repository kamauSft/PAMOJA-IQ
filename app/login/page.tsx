import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";
import { MovingScenes } from "@/components/moving-scenes";
import { Preferences } from "@/components/preferences";
import { brand } from "@/config/brand";
import { copy } from "@/content/ui";
import { getLocale } from "@/lib/locale";
import { normalizePhone } from "@/lib/phone";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ who?: string; phone?: string; door?: string }>;
}) {
  const query = await searchParams;
  const locale = await getLocale();
  const text = copy(locale);
  const freshPhone = query.phone && normalizePhone(query.phone) ? query.phone : null;
  // "who" is the older spelling of "door"; shared links with it still work.
  const asked = (query.door ?? query.who)?.toLowerCase();
  const door = asked === "member" ? "member" : asked === "treasurer" || asked === "chair" ? "treasurer" : null;

  if (!freshPhone && !door) redirect("/");

  const title =
    door === "treasurer" ? text.shell.roles.TREASURER : door === "member" ? text.shell.roles.MEMBER : text.login.signIn;
  const intro = freshPhone
    ? text.login.fresh
    : door === "treasurer"
      ? text.login.doorTreasurer
      : door === "member"
        ? text.login.doorMember
        : text.login.fallback;
  const treasurerDoor = door === "treasurer";
  const preferredRole = door === "member" ? "MEMBER" : door === "treasurer" ? "TREASURER" : undefined;

  return (
    <main>
      <MovingScenes start={treasurerDoor ? "treasurer-desk" : "member-morning"} variant="page" priority>
        <div className="w-full max-w-md">
          <div className="mb-6 rounded-xl border border-white/20 bg-[#0F2A3D]/55 p-4 text-white backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em]">
                <BrandMark />
                {brand.name}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="tap shrink-0 rounded-lg border border-white/40 px-3 py-2 text-[13px] font-semibold text-white hover:bg-white/10"
                >
                  {text.shell.homeLink}
                </Link>
                <Preferences
                  locale={locale}
                  languageLabel={text.language}
                  lightLabel={text.themeLight}
                  darkLabel={text.themeDark}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-white/80">{brand.tagline}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/80">
              {treasurerDoor ? text.shell.roles.TREASURER : text.login.todayTitle}
            </p>
            <h1 className="mt-1 text-[2rem]">{title}</h1>
            <p className="mt-2 text-sm text-white/85">{intro}</p>
          </div>
          <LoginForm
            initialPhone=""
            initialPin=""
            startWithPin
            afterSignIn={door === "member" ? "/home" : door === "treasurer" ? "/desk" : undefined}
            preferredRole={preferredRole}
            showForgot={door !== "treasurer"}
            labels={text.login}
          />
        </div>
      </MovingScenes>
    </main>
  );
}
