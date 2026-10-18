"use client";

import { useState } from "react";
import { copy } from "@/content/ui";

const english = copy("en").pin;

export function MemberPinForm({ labels = english }: { labels?: typeof english }) {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      setMessage(body?.ok ? labels.saved : body?.message || labels.failed);
    } catch {
      setMessage(labels.failed);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mt-4 p-4">
      <h2 className="font-display text-2xl">{labels.title}</h2>
      <p className="mt-1 text-sm text-muted">{labels.body}</p>
      <label className="mt-3 block text-sm font-medium">
        {labels.label}
        <input
          className="field max-w-xs font-mono tracking-[0.3em]"
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          autoComplete="new-password"
          name="member-pin"
        />
      </label>
      <button
        className="btn mt-3 disabled:opacity-60"
        disabled={pending || pin.length !== 4}
        type="submit"
      >
        {pending ? labels.saving : labels.save}
      </button>
      {message ? (
        <p className="mt-3 text-sm text-muted" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
