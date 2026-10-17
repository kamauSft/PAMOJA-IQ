import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";
import { Preferences } from "@/components/preferences";
import { brand } from "@/config/brand";
import { copy } from "@/content/ui";
import { getLocale } from "@/lib/locale";
import { normalizePhone } from "@/lib/phone";

const WHO = {
  treasurer: {
    phone: "0712345002",
    pin: "2580",
    en: "Enter the number and PIN, then the code shown on this page.",
    sw: "Weka nambari na PIN, kisha msimbo ulio kwenye ukurasa huu.",
  },
  member: {
    phone: "0712345005",
    pin: "",
    en: "Enter the number. The code appears on this page. A PIN can skip the code.",
    sw: "Weka nambari. Msimbo unaonekana kwenye ukurasa huu. PIN inaweza kuruka msimbo.",
  },
  chair: {
    phone: "0712345001",
    pin: "2580",
    en: "Enter the number and PIN, then the code shown on this page.",
    sw: "Weka nambari na PIN, kisha msimbo ulio kwenye ukurasa huu.",
  },
} as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ who?: string; phone?: string; door?: string }>;
}) {
  const query = await searchParams;
  const locale = await getLocale();
  const text = copy(locale);
  const freshPhone = query.phone && normalizePhone(query.phone) ? query.phone : null;
  const whoKey = query.who === "treasurer" || query.who === "member" || query.who === "chair" ? query.who : null;
  const who = freshPhone || !whoKey ? null : WHO[whoKey];
  const door = query.door === "treasurer" || query.door === "member" ? query.door : null;
  const title = who
    ? text.shell.roles[who === WHO.member ? "MEMBER" : who === WHO.chair ? "CHAIR" : "TREASURER"]
    : door === "treasurer"
      ? text.shell.roles.TREASURER
      : door === "member"
        ? text.shell.roles.MEMBER
        : text.login.signIn;
  const intro = freshPhone
    ? text.login.fresh
    : who
      ? who[locale]
      : door === "treasurer"
        ? text.login.doorTreasurer
        : door === "member"
          ? text.login.doorMember
          : text.login.fallback;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-leaf">
          <BrandMark />
          {brand.name}
        </p>
        <Preferences locale={locale} languageLabel={text.language} lightLabel={text.themeLight} darkLabel={text.themeDark} />
      </div>
      <p className="mt-2 text-xs text-muted">{brand.tagline}</p>
      <h1 className="mt-3 font-display text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">{intro}</p>
      <div className="mt-6">
        <LoginForm
          initialPhone={freshPhone ?? who?.phone ?? ""}
          initialPin={freshPhone ? "" : (who?.pin ?? "")}
          startWithPin={freshPhone ? true : door === "treasurer" ? true : Boolean(who?.pin)}
          labels={text.login}
        />
      </div>
    </main>
  );
}
