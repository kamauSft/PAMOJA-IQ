"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UnlockList({
  people,
}: {
  people: { personId: string; memberNo: string; name: string }[];
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState("");

  if (people.length === 0) return null;

  async function unlock(personId: string) {
    setPending(personId);
    setMessage("");
    try {
      const response = await fetch("/api/members/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ personId, pin }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!response.ok || !body?.ok) {
        setMessage(body?.message || "The number could not be unlocked.");
        return;
      }
      setMessage("Unlocked. They can sign in with their PIN.");
      router.refresh();
    } catch {
      setMessage("The number could not be unlocked.");
    } finally {
      setPending("");
    }
  }

  return (
    <section className="card mt-6 p-5">
      <h2 className="text-2xl">Locked after 3 wrong PINs</h2>
      <p className="mt-1 text-sm text-muted">Enter your own PIN, then unlock the member. Nothing is sent to a phone.</p>
      <label className="mt-3 block max-w-xs text-sm font-medium">
        Your PIN
        <input
          className="field font-mono tracking-[0.2em]"
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
        />
      </label>
      <ul className="mt-4 space-y-3 text-sm">
        {people.map((person) => (
          <li key={person.personId} className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
            <span>
              {person.memberNo} {person.name}
            </span>
            <button className="btn" type="button" disabled={pending === person.personId} onClick={() => unlock(person.personId)}>
              {pending === person.personId ? "Unlocking…" : "Unlock"}
            </button>
          </li>
        ))}
      </ul>
      {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
    </section>
  );
}
