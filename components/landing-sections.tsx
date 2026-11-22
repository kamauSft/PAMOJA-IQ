import Image from "next/image";
import Link from "next/link";
import { brand } from "@/config/brand";
import { copy } from "@/content/ui";

type SiteCopy = ReturnType<typeof copy>["site"];

function SectionHeading({
  eyebrow,
  title,
  body,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  dark?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${dark ? "text-[#7DDECA]" : "text-[#146B3A]"}`}>
        {eyebrow}
      </p>
      <h2
        className={`editorial text-balance mt-3 text-3xl leading-tight sm:text-4xl lg:text-5xl ${
          dark ? "text-white" : "text-[#0B3D24]"
        }`}
      >
        {title}
      </h2>
      {body ? <p className={`mt-4 text-base leading-7 ${dark ? "text-white/75" : "text-[#3D5B51]"}`}>{body}</p> : null}
    </div>
  );
}

export function ProofBand({ site }: { site: SiteCopy }) {
  return (
    <section id="proof" className="scroll-mt-24 bg-[#0B3D24] py-10 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#7DDECA]">{site.proof.title}</p>
        <div className="mt-6 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {site.proof.items.map((item) => (
            <div key={item.label} className="border-white/15 md:border-l md:first:border-l-0">
              <p className="editorial text-4xl text-white sm:text-5xl">{item.value}</p>
              <p className="mt-1 text-sm text-white/70">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutSection({ site }: { site: SiteCopy }) {
  return (
    <section id="about" className="scroll-mt-24 bg-[#EAF7EF] py-20 text-[#0B3D24]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
            <Image
              src="/images/chama-meeting-desktop.webp"
              alt={site.about.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -right-3 w-44 rounded-xl bg-white p-4 shadow-lg sm:-right-6 sm:w-56">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#146B3A]">Agentic AI</p>
            <p className="editorial mt-1 text-xl leading-snug">Reads the sheet. Keeps the line.</p>
          </div>
        </div>
        <div className="lg:pl-6">
          <SectionHeading eyebrow={site.about.eyebrow} title={site.about.title} body={site.about.body} />
          <ul className="mt-8 space-y-4">
            {site.about.points.map((point) => (
              <li key={point} className="flex gap-3 text-sm leading-6 text-[#24463A]">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#146B3A]" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <Link href="#how" className="btn mt-8 rounded-full bg-[#146B3A] text-white">
            {site.how.eyebrow}
            <svg viewBox="0 0 24 24" className="ml-2 h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M12 4l-1.4 1.4L16.2 11H4v2h12.2l-5.6 5.6L12 20l8-8z" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HowSection({ site }: { site: SiteCopy }) {
  return (
    <section id="how" className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow={site.how.eyebrow} title={site.how.title} body={site.how.body} />
          <p className="editorial max-w-sm text-2xl text-[#146B3A]">{brand.meaning}</p>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {site.how.steps.map((step, index) => (
            <li key={step.title} className="relative rounded-2xl border border-line bg-[#F6F1E7] p-6">
              <span className="editorial block text-5xl text-[#146B3A]/30">0{index + 1}</span>
              <h3 className="editorial mt-4 text-2xl text-[#0B3D24]">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#3D5B51]">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function DoorsSection({ site }: { site: SiteCopy }) {
  const doors = [
    {
      title: site.doors.memberTitle,
      body: site.doors.memberBody,
      cta: site.doors.memberCta,
      href: "/login?door=member",
      film: "/images/member-morning-desktop.webp",
    },
    {
      title: site.doors.treasurerTitle,
      body: site.doors.treasurerBody,
      cta: site.doors.treasurerCta,
      href: "/login?door=treasurer",
      film: "/images/treasurer-desk-desktop.webp",
    },
  ];

  return (
    <section id="doors" className="scroll-mt-24 bg-[#F6F1E7] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow={site.doors.eyebrow} title={site.doors.title} body={site.doors.body} />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {doors.map((door) => (
            <article key={door.title} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="relative h-44">
                <Image src={door.film} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                <div className="absolute inset-0 bg-[#0B3D24]/35" />
              </div>
              <div className="p-6">
                <h3 className="editorial text-2xl text-[#0B3D24]">{door.title}</h3>
                <p className="mt-3 min-h-16 text-sm leading-6 text-[#3D5B51]">{door.body}</p>
                <Link href={door.href} className="btn mt-5 rounded-full bg-[#146B3A] text-white">
                  {door.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ site }: { site: SiteCopy }) {
  return (
    <section id="faq" className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading eyebrow={site.faq.eyebrow} title={site.faq.title} />
        <div className="divide-y divide-line rounded-2xl border border-line">
          {site.faq.items.map((item, index) => (
            <details key={item.question} className="group p-5" open={index === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-[#0B3D24]">
                {item.question}
                <span className="text-[#146B3A] transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-[#3D5B51]">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactSection({ site }: { site: SiteCopy }) {
  return (
    <section id="contact" className="scroll-mt-24 bg-[#0B3D24] py-20 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading eyebrow={site.contact.eyebrow} title={site.contact.title} body={site.contact.body} dark />
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          <Link href="/start" className="btn rounded-full bg-white text-[#0B3D24]">
            {site.contact.button}
          </Link>
          <a href={`mailto:${brand.supportEmail}`} className="btn btn-line rounded-full border-white/40 bg-transparent text-white">
            {site.contact.emailLabel}
          </a>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter({ site }: { site: SiteCopy }) {
  return (
    <footer className="bg-[#082A19] py-10 text-white/75">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-white">
            <span className="editorial text-xl">{brand.name}</span>
            <span className="rounded-full bg-[#146B3A] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
              AI
            </span>
          </p>
          <p className="mt-2 text-sm">{site.footer.tagline}</p>
          <p className="mt-1 text-sm text-white/55">{site.footer.note}</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href="#about" className="hover:text-white">{site.nav.about}</a>
          <a href="#how" className="hover:text-white">{site.nav.how}</a>
          <a href="#faq" className="hover:text-white">{site.nav.faq}</a>
          <a href={`mailto:${brand.supportEmail}`} className="hover:text-white">{brand.supportEmail}</a>
        </div>
        <p className="text-sm text-white/55">
          © {new Date().getFullYear()} {brand.name}. {site.footer.rights}
        </p>
      </div>
    </footer>
  );
}
