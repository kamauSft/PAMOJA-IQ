import Link from "next/link";
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
    en: "Peter Otieno, treasurer of Umoja. Number, PIN 2580, then the text code on this page. After it, you are in the treasurer's books.",
    sw: "Peter Otieno, mweka hazina wa Umoja. Nambari, PIN 2580, kisha msimbo ulio kwenye ukurasa huu. Baada yake unaingia kwenye daftari.",
  },
  member: {
    phone: "0712345005",
    pin: "",
    en: "Amina Hassan, member of Umoja. Enter her number. The text code appears on this page in demo mode. She sees only her own money. Use a PIN instead, with 2580, to skip the code.",
    sw: "Amina Hassan, mwanachama wa Umoja. Weka nambari yake. Msimbo unaonekana hapa katika hali ya mfano. Anaona pesa zake tu. Tumia PIN 2580 kuruka msimbo.",
  },
  chair: {
    phone: "0712345001",
    pin: "2580",
    en: "Grace Wanjiku, chair of Umoja. Number, PIN 2580, then the text code. The chair opens the same treasurer's books.",
    sw: "Grace Wanjiku, mwenyekiti wa Umoja. Nambari, PIN 2580, kisha msimbo. Mwenyekiti anafungua daftari lile lile la mweka hazina.",
  },
} as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ who?: string; phone?: string }>;
}) {
  const query = await searchParams;
  const locale = await getLocale();
  const text = copy(locale);
  const freshPhone = query.phone && normalizePhone(query.phone) ? query.phone : null;
  const whoKey = query.who === "treasurer" || query.who === "member" || query.who === "chair" ? query.who : null;
  const who = freshPhone || !whoKey ? null : WHO[whoKey];
  const title = who ? text.shell.roles[who === WHO.member ? "MEMBER" : who === WHO.chair ? "CHAIR" : "TREASURER"] : text.login.signIn;

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
      <p className="mt-2 text-sm text-muted">{freshPhone ? text.login.fresh : who ? who[locale] : text.login.fallback}</p>
      <div className="mt-6">
        <LoginForm
          initialPhone={freshPhone ?? who?.phone ?? "0712345005"}
          initialPin={freshPhone ? "" : (who?.pin ?? "")}
          startWithPin={freshPhone ? true : Boolean(who?.pin)}
          labels={text.login}
        />
      </div>
      <p className="mt-6 text-sm text-muted">
        <Link className="underline" href="/start">
          {text.login.create}
        </Link>
      </p>
    </main>
  );
}
