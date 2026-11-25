"use client";

import { useState, type ReactNode } from "react";
import { copy } from "@/content/ui";

type Text = ReturnType<typeof copy>;
type Status = "PAID" | "LATE" | "MISSED" | "NOT_DUE";

const SHEET_ROWS = [
  {
    member: "Member 014",
    phone: "071••••014",
    jan: "1,500",
    feb: "1,500",
    mar: "1,500",
    total: "4,500",
  },
  {
    member: "Member 027",
    phone: "071••••027",
    jan: "1,500",
    feb: "—",
    mar: "1,500",
    total: "3,000",
  },
  {
    member: "Member 041",
    phone: "071••••041",
    jan: "—",
    feb: "1,500",
    mar: "1,500",
    total: "3,000",
  },
];

const MONTH_ROWS: Array<{ member: string; jan: Status; feb: Status; mar: Status }> = [
  { member: "Member 014", jan: "PAID", feb: "PAID", mar: "PAID" },
  { member: "Member 027", jan: "PAID", feb: "LATE", mar: "PAID" },
  { member: "Member 041", jan: "NOT_DUE", feb: "PAID", mar: "MISSED" },
];

const STATUS_STYLE: Record<Status, string> = {
  PAID: "bg-[#E4F4EA] text-[#146B3A]",
  LATE: "bg-[#FFF2D6] text-[#8A5B00]",
  MISSED: "bg-[#FBE7E3] text-[#A33A2B]",
  NOT_DUE: "bg-[#EFF2F4] text-[#5B6B78]",
};

function WindowFrame({
  file,
  badge,
  children,
}: {
  file: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#CBE4D6] bg-white shadow-[0_18px_50px_rgba(11,61,36,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-[#F6F1E7] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex gap-1" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-[#7DDECA]" />
            <span className="h-2 w-2 rounded-full bg-[#CBE4D6]" />
            <span className="h-2 w-2 rounded-full bg-[#146B3A]/30" />
          </span>
          <span className="font-mono text-xs text-[#24463A]">{file}</span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#146B3A]">
          {badge}
        </span>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-line bg-[#F6F1E7] ${compact ? "px-3 py-2" : "p-3"}`}>
      <p className={`editorial ${compact ? "text-2xl" : "text-xl"} text-[#0B3D24]`}>{value}</p>
      <p className="mt-0.5 text-[11px] leading-4 text-[#3D5B51]">{label}</p>
    </div>
  );
}

function StatusChip({ status, label }: { status: Status; label: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${STATUS_STYLE[status]}`}
    >
      {label}
    </span>
  );
}

export function ProductProof({ text }: { text: Text }) {
  const [active, setActive] = useState(0);
  const { site, upload, publish, statement, home } = text;
  const proof = site.proof;

  const panels = [
    <WindowFrame key="sheet" file={proof.file} badge={upload.kicker}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.14em] text-[#5B6B78]">
              <th className="py-2 pr-3 font-semibold">{upload.who}</th>
              <th className="py-2 pr-3 font-semibold">JAN</th>
              <th className="py-2 pr-3 font-semibold">FEB</th>
              <th className="py-2 pr-3 font-semibold">MAR</th>
              <th className="py-2 font-semibold">JUMLA</th>
            </tr>
          </thead>
          <tbody className="num text-[#24463A]">
            {SHEET_ROWS.map((row) => (
              <tr key={row.member} className="border-b border-line/70">
                <td className="py-3 pr-3 font-sans">
                  <span className="block font-semibold text-[#0B3D24]">{row.member}</span>
                  <span className="text-[11px] text-muted">{row.phone}</span>
                </td>
                <td className="py-3 pr-3">{row.jan}</td>
                <td className="py-3 pr-3">{row.feb}</td>
                <td className="py-3 pr-3">{row.mar}</td>
                <td className="py-3 font-semibold">{row.total}</td>
              </tr>
            ))}
            <tr className="bg-[#F6F1E7] text-[#8A6B3D] line-through">
              <td className="py-3 pr-3 font-sans font-semibold">JUMLA</td>
              <td className="py-3 pr-3">4,500</td>
              <td className="py-3 pr-3">3,000</td>
              <td className="py-3 pr-3">3,000</td>
              <td className="py-3">
                <span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] no-underline">
                  {proof.skipped}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Metric compact label={upload.members} value="3" />
        <Metric compact label={upload.payments} value="9" />
        <Metric compact label={proof.notPlaced} value="1" />
      </div>
    </WindowFrame>,

    <WindowFrame key="review" file="agent-review" badge={upload.kicker}>
      <div className="grid grid-cols-3 gap-3">
        <Metric compact label={upload.members} value="3" />
        <Metric compact label={upload.payments} value="9" />
        <Metric compact label={proof.notPlaced} value="1" />
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.14em] text-[#5B6B78]">
              <th className="py-2 pr-3 font-semibold">{upload.who}</th>
              <th className="py-2 pr-3 font-semibold">{upload.month}</th>
              <th className="py-2 pr-3 font-semibold">{upload.amount}</th>
              <th className="py-2 font-semibold">{upload.place}</th>
            </tr>
          </thead>
          <tbody className="text-[#24463A]">
            <tr className="border-b border-line/70">
              <td className="py-3 pr-3 font-mono text-xs">071••••014 · JAN</td>
              <td className="py-3 pr-3">JAN</td>
              <td className="num py-3 pr-3">1,500</td>
              <td className="py-3">
                <span className="font-semibold text-[#0B3D24]">Member 014</span>
                <span className="block text-[11px] text-[#146B3A]">{proof.matched}</span>
              </td>
            </tr>
            <tr className="border-b border-line/70">
              <td className="py-3 pr-3 font-mono text-xs">071••••027 · MAR</td>
              <td className="py-3 pr-3">MAR</td>
              <td className="num py-3 pr-3">1,500</td>
              <td className="py-3">
                <span className="font-semibold text-[#0B3D24]">Member 027</span>
                <span className="block text-[11px] text-[#146B3A]">{upload.onRegister}</span>
              </td>
            </tr>
            <tr className="border-b border-line/70">
              <td className="py-3 pr-3 font-mono text-xs">071••••041 · FEB</td>
              <td className="py-3 pr-3">FEB</td>
              <td className="num py-3 pr-3">1,500</td>
              <td className="py-3">
                <span className="font-semibold text-[#0B3D24]">Member 041</span>
                <span className="block text-[11px] text-[#146B3A]">{proof.matched}</span>
              </td>
            </tr>
            <tr className="bg-[#FFF8E8]">
              <td className="py-3 pr-3 font-mono text-xs">Name only · FEB</td>
              <td className="py-3 pr-3">FEB</td>
              <td className="num py-3 pr-3">1,200</td>
              <td className="py-3">
                <span className="font-semibold text-[#8A5B00]">{proof.notPlaced}</span>
                <span className="block text-[11px] text-[#8A5B00]">{upload.left}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-5 rounded-xl bg-[#EAF7EF] p-3 text-xs leading-5 text-[#24463A]">
        {proof.steps[1].body}
      </p>
    </WindowFrame>,

    <WindowFrame key="grid" file="month-grid" badge={publish.kicker}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="editorial text-2xl text-[#0B3D24]">{publish.title}</p>
        <span className="rounded-full border border-[#CBE4D6] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#146B3A]">
          {proof.deskOnly}
        </span>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.14em] text-[#5B6B78]">
              <th className="py-2 pr-3 font-semibold">{upload.members}</th>
              <th className="py-2 pr-3 font-semibold">JAN</th>
              <th className="py-2 pr-3 font-semibold">FEB</th>
              <th className="py-2 font-semibold">MAR</th>
            </tr>
          </thead>
          <tbody>
            {MONTH_ROWS.map((row) => (
              <tr key={row.member} className="border-b border-line/70">
                <td className="py-3 pr-3 font-semibold text-[#0B3D24]">{row.member}</td>
                <td className="py-3 pr-3">
                  <StatusChip status={row.jan} label={home.mark[row.jan]} />
                </td>
                <td className="py-3 pr-3">
                  <StatusChip status={row.feb} label={home.mark[row.feb]} />
                </td>
                <td className="py-3">
                  <StatusChip status={row.mar} label={home.mark[row.mar]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-5 text-xs leading-5 text-[#3D5B51]">{proof.steps[2].body}</p>
    </WindowFrame>,

    <WindowFrame key="publish" file="publish → member home" badge={publish.kicker}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-[#F6F1E7] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A5B00]">
            {proof.deskOnly}
          </p>
          <p className="editorial mt-2 text-xl text-[#0B3D24]">{publish.waiting}</p>
          <ul className="mt-4 space-y-2 text-sm text-[#24463A]">
            <li className="flex justify-between border-b border-line/70 pb-2">
              <span>Member 014</span>
              <span className="text-xs text-[#146B3A]">{publish.now}</span>
            </li>
            <li className="flex justify-between border-b border-line/70 pb-2">
              <span>Member 027</span>
              <span className="text-xs text-[#146B3A]">{publish.now}</span>
            </li>
            <li className="flex justify-between pb-2">
              <span>Member 041</span>
              <span className="text-xs text-[#146B3A]">{publish.now}</span>
            </li>
          </ul>
          <span className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#146B3A] px-4 text-sm font-semibold text-white">
            {publish.action}
          </span>
        </div>
        <div className="rounded-xl border border-[#CBE4D6] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-[#146B3A]">{proof.publishedAt}</p>
            <span className="h-2 w-2 rounded-full bg-[#146B3A]" aria-hidden="true" />
          </div>
          <p className="mt-2 text-xs text-muted">{proof.memberView}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label={home.savings} value="KES 4,500" />
            <Metric label={home.loan} value="KES 0" />
            <Metric label={home.net} value="KES 4,500" />
          </div>
          <p className="mt-4 text-[11px] text-muted">{home.onlyYou}</p>
          <div className="mt-4 border-t border-line pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5B6B78]">
              {statement.title}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-[#24463A]">
              <li className="flex justify-between">
                <span>12 MAR · {statement.entry}</span>
                <span className="num">+1,500</span>
              </li>
              <li className="flex justify-between">
                <span>12 FEB · {statement.entry}</span>
                <span className="num">+1,500</span>
              </li>
              <li className="flex justify-between">
                <span>12 JAN · {statement.entry}</span>
                <span className="num">+1,500</span>
              </li>
            </ul>
            <p className="mt-2 text-[11px] text-muted">{proof.statementNote}</p>
          </div>
        </div>
      </div>
    </WindowFrame>,
  ];

  return (
    <section id="proof" className="scroll-mt-24 overflow-hidden bg-[#EAF7EF] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#146B3A]">
            {proof.eyebrow}
          </p>
          <h2 className="editorial text-balance mt-3 text-3xl leading-tight text-[#0B3D24] sm:text-4xl lg:text-5xl">
            {proof.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-[#3D5B51]">{proof.body}</p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[19rem_1fr]">
          <ol className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {proof.steps.map((step, index) => (
              <li key={step.label} className="shrink-0 lg:w-full">
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-current={active === index ? "step" : undefined}
                  className={`tap w-full rounded-xl border px-4 py-3 text-left transition lg:w-auto ${
                    active === index
                      ? "border-[#146B3A] bg-[#146B3A] text-white shadow-md"
                      : "border-[#CBE4D6] bg-white text-[#0B3D24] hover:border-[#146B3A]/50"
                  }`}
                >
                  <span
                    className={`block text-[10px] font-semibold uppercase tracking-[0.14em] ${
                      active === index ? "text-[#7DDECA]" : "text-[#146B3A]"
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="mt-1 block text-sm font-semibold">{step.title}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="relative min-w-0">
            <div
              className="absolute inset-x-8 -top-6 hidden h-px bg-gradient-to-r from-transparent via-[#7DDECA] to-transparent lg:block"
              aria-hidden="true"
            />
            <div key={active} data-proof-panel={active} aria-live="polite" className="proof-panel">
              {panels[active]}
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-[#3D5B51]">{proof.note}</p>
      </div>
    </section>
  );
}
