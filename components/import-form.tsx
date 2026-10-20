"use client";

import { useState } from "react";
import Link from "next/link";
import { copy } from "@/content/ui";
import { formatKes } from "@/lib/finance/money";

const english = copy("en").upload;

interface PreviewMember {
  memberNo: string | null;
  name: string;
  phone: string;
  role: string;
}

interface PreviewPayment {
  name: string;
  phone: string | null;
  period: string;
  amountCents: number;
  sheet: string;
  row: number;
  placement: "register" | "new" | "name" | "ambiguous" | "left";
  placedName: string | null;
  placedNo: string | null;
}

interface Preview {
  members: PreviewMember[];
  memberCount: number;
  contributionCount: number;
  payments?: PreviewPayment[];
  problems: string[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(period: string): string {
  const [year, month] = period.split("-");
  const name = MONTHS[Number(month) - 1];
  return name ? `${name} ${year}` : period;
}

function kes(cents: number): string {
  try {
    return formatKes(cents);
  } catch {
    return "KES —";
  }
}

function Placement({ payment, labels }: { payment: PreviewPayment; labels: typeof english }) {
  return (
    <>
      {payment.placement === "register" || payment.placement === "name" ? (
        <>
          <span>
            {payment.placedNo} {payment.placedName}
          </span>
          <span className="block text-xs text-muted">{payment.placement === "name" ? labels.byName : labels.onRegister}</span>
        </>
      ) : null}
      {payment.placement === "new" ? <span>{labels.willAdd}</span> : null}
      {payment.placement === "ambiguous" ? <span className="text-clay">{labels.ambiguous}</span> : null}
      {payment.placement === "left" ? <span className="text-clay">{labels.left}</span> : null}
      <span className="block text-xs text-muted">
        {payment.sheet} · {payment.row}
      </span>
    </>
  );
}

interface Saved {
  membersAdded: number;
  membersAlready: number;
  contributionsAdded: number;
  contributionsUpdated?: number;
  contributionsSkipped: number;
  problems: string[];
}

export function ImportForm({ labels = english }: { labels?: typeof english }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function send(mode: "preview" | "save") {
    if (!file) {
      setMessage(labels.empty);
      return;
    }
    setPending(true);
    setMessage("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("mode", mode);
      const response = await fetch("/api/import", { method: "POST", body });
      const payload = (await response.json().catch(() => null)) as (Preview & Saved & { message?: string; problems?: string[] }) | null;
      if (!response.ok || !payload) {
        setPreview(null);
        setMessage(payload?.message || labels.failed);
        if (payload?.problems?.length) setPreview({ members: [], memberCount: 0, contributionCount: 0, problems: payload.problems });
        return;
      }
      if (mode === "save") {
        setSaved(payload);
        setPreview(null);
        return;
      }
      setSaved(null);
      setPreview(payload);
    } catch {
      setMessage(labels.failed);
    } finally {
      setPending(false);
    }
  }

  if (saved) {
    return (
      <div className="card mt-6 p-6" data-testid="import-result">
        <h2 className="font-serif text-2xl">{labels.done}</h2>
        <ul className="mt-3 space-y-1 text-sm">
          <li>
            {labels.added}: {saved.membersAdded}
          </li>
          <li>
            {labels.already}: {saved.membersAlready}
          </li>
          <li>
            {labels.paymentsAdded}: {saved.contributionsAdded}
          </li>
          <li>
            {labels.paymentsChanged}: {saved.contributionsUpdated ?? 0}
          </li>
          <li>
            {labels.paymentsSkipped}: {saved.contributionsSkipped}
          </li>
        </ul>
        {saved.problems.length > 0 ? (
          <ul className="mt-4 space-y-1 text-sm text-clay">
            {saved.problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        ) : null}
        <Link href="/publish" className="btn mt-6">
          {labels.open}
        </Link>
      </div>
    );
  }

  return (
    <div className="card mt-6 p-6">
      <label className="block text-sm font-medium">
        {labels.choose}
        <input
          className="field"
          type="file"
          name="file"
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setPreview(null);
            setMessage("");
          }}
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="btn disabled:opacity-60"
          type="button"
          disabled={pending}
          onClick={() => send("preview")}
        >
          {pending ? labels.checking : labels.preview}
        </button>
        {preview ? (
          <button
            className="btn disabled:opacity-60"
            type="button"
            disabled={pending}
            onClick={() => send("save")}
          >
            {pending ? labels.saving : labels.save}
          </button>
        ) : null}
      </div>
      {message ? (
        <p className="mt-4 text-sm text-clay" role="alert">
          {message}
        </p>
      ) : null}
      {preview ? (
        <div className="mt-6" data-testid="import-preview">
          <p className="text-sm">
            {labels.members}: {preview.memberCount}. {labels.payments}: {preview.contributionCount}.
          </p>
          {preview.payments && preview.payments.length > 0 ? (
            <div className="mt-4">
              <ul className="space-y-3 md:hidden">
                {preview.payments.map((payment) => (
                  <li key={`${payment.sheet}-${payment.row}-${payment.period}`} className="border-t border-ink/10 pt-3">
                    <p className="font-medium">{payment.name || "—"}</p>
                    {payment.phone ? <p className="text-xs text-muted">{payment.phone}</p> : null}
                    <p className="mt-1 flex items-baseline justify-between gap-4">
                      <span>{monthLabel(payment.period)}</span>
                      <span className="font-mono tabular-nums">{kes(payment.amountCents)}</span>
                    </p>
                    <Placement payment={payment} labels={labels} />
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.14em] text-muted">
                    <tr>
                      <th className="border-b border-ink/15 px-3 py-2 font-medium">{labels.who}</th>
                      <th className="border-b border-ink/15 px-3 py-2 font-medium">{labels.month}</th>
                      <th className="border-b border-ink/15 px-3 py-2 text-right font-medium">{labels.amount}</th>
                      <th className="border-b border-ink/15 px-3 py-2 font-medium">{labels.place}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.payments.map((payment) => (
                      <tr key={`${payment.sheet}-${payment.row}-${payment.period}-wide`} className="border-b border-ink/10">
                        <td className="px-3 py-2">
                          {payment.name || "—"}
                          {payment.phone ? <span className="block text-xs text-muted">{payment.phone}</span> : null}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">{monthLabel(payment.period)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums">{kes(payment.amountCents)}</td>
                        <td className="px-3 py-2">
                          <Placement payment={payment} labels={labels} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.contributionCount > preview.payments.length ? (
                <p className="mt-2 text-xs text-muted">{labels.showing}</p>
              ) : null}
            </div>
          ) : null}
          {preview.problems.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-semibold text-clay">{labels.problems}</p>
              <ul className="mt-2 space-y-1 text-sm text-clay">
                {preview.problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
