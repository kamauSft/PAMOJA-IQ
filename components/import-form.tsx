"use client";

import { useState } from "react";
import Link from "next/link";
import { copy } from "@/content/ui";

const english = copy("en").upload;

interface PreviewMember {
  memberNo: string | null;
  name: string;
  phone: string;
  role: string;
}

interface Preview {
  members: PreviewMember[];
  memberCount: number;
  contributionCount: number;
  problems: string[];
}

interface Saved {
  membersAdded: number;
  membersAlready: number;
  contributionsAdded: number;
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
        <Link href="/publish" className="tap mt-6 rounded-full bg-sisal px-5 text-sm font-semibold text-ink">
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
          className="tap rounded-full bg-leaf px-5 text-sm font-semibold text-ivory disabled:opacity-60"
          type="button"
          disabled={pending}
          onClick={() => send("preview")}
        >
          {pending ? labels.checking : labels.preview}
        </button>
        {preview ? (
          <button
            className="tap rounded-full bg-sisal px-5 text-sm font-semibold text-ink disabled:opacity-60"
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
          <ul className="mt-3 space-y-2 text-sm">
            {preview.members.map((member) => (
              <li key={`${member.phone}-${member.memberNo}-${member.name}`}>
                {member.memberNo ? `${member.memberNo} ` : ""}
                {member.name}
                {member.phone ? ` · ${member.phone}` : ""}
              </li>
            ))}
          </ul>
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
