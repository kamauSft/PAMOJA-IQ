"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/content/ui";

const english = copy("en").start;

export function StartForm({ labels = english }: { labels?: typeof english }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [chamaName, setChamaName] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/chama/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, phone, pin, chamaName }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string; phone?: string } | null;
      if (!response.ok || !body?.phone) {
        setMessage(body?.message || labels.failed);
        return;
      }
      router.push(`/login?phone=${encodeURIComponent(body.phone)}`);
    } catch {
      setMessage(labels.failed);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <label className="block text-sm font-medium">
        {labels.name}
        <input className="field" name="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
      </label>
      <label className="block text-sm font-medium">
        {labels.phone}
        <input
          className="field"
          name="phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          inputMode="tel"
          autoComplete="tel"
        />
      </label>
      <label className="block text-sm font-medium">
        {labels.pin}
        <input
          className="field"
          name="pin"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={4}
        />
      </label>
      <label className="block text-sm font-medium">
        {labels.chama}
        <input className="field" name="chama" value={chamaName} onChange={(event) => setChamaName(event.target.value)} />
      </label>
      <button className="btn w-full disabled:opacity-60" disabled={pending} type="submit">
        {pending ? labels.working : labels.submit}
      </button>
      {message ? (
        <p className="text-sm text-clay" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
