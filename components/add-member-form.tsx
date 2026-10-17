"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddMemberForm({
  labels,
}: {
  labels: {
    addTitle: string;
    addBody: string;
    addName: string;
    addPhone: string;
    addSave: string;
    addWorking: string;
    addFailed: string;
    addDone: string;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setDone("");
    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string; phone?: string; memberNo?: string } | null;
      if (!response.ok || !body?.phone || !body.memberNo) {
        setMessage(body?.message || labels.addFailed);
        return;
      }
      setName("");
      setPhone("");
      setDone(`${labels.addDone} ${body.phone} (${body.memberNo}).`);
      router.refresh();
    } catch {
      setMessage(labels.addFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mt-4 space-y-4 p-4">
      <div>
        <h2 className="font-display text-2xl">{labels.addTitle}</h2>
        <p className="mt-1 text-sm text-muted">{labels.addBody}</p>
      </div>
      <label className="block text-sm font-medium">
        {labels.addName}
        <input className="field" name="name" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="block text-sm font-medium">
        {labels.addPhone}
        <input className="field" name="phone" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
      </label>
      <button className="btn disabled:opacity-60" disabled={pending} type="submit">
        {pending ? labels.addWorking : labels.addSave}
      </button>
      {done ? <p className="text-sm text-leaf">{done}</p> : null}
      {message ? (
        <p className="text-sm text-clay" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
