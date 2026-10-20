"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MembershipRole } from "@prisma/client";
import type { SignInPerson } from "@/lib/chama/sign-in-list";

export function SignInCare({
  people,
  roles,
  labels,
}: {
  people: SignInPerson[];
  roles: Record<MembershipRole, string>;
  labels: {
    signTitle: string;
    signBody: string;
    yourPin: string;
    unlock: string;
    unlocking: string;
    newPin: string;
    signWorking: string;
    unlocked: string;
    issued: string;
    issuedTail: string;
    signFailed: string;
    locked: string;
    open: string;
    signNobody: string;
    copyPin: string;
    copied: string;
  };
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [issued, setIssued] = useState("");
  const [pending, setPending] = useState("");

  async function unlock(personId: string) {
    setPending(personId);
    setMessage("");
    setIssued("");
    try {
      const response = await fetch("/api/members/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ personId, pin }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      setMessage(response.ok && body?.ok ? labels.unlocked : body?.message || labels.signFailed);
      if (response.ok && body?.ok) router.refresh();
    } catch {
      setMessage(labels.signFailed);
    } finally {
      setPending("");
    }
  }

  async function resetPin(person: SignInPerson) {
    const membershipId = person.roles[0]?.membershipId;
    if (!membershipId) return;
    setPending(person.personId);
    setMessage("");
    setIssued("");
    try {
      const response = await fetch("/api/members/reset-pin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ membershipId, pin }),
      });
      const body = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
        name?: string;
        pins?: { role: MembershipRole; memberNo: string; temporaryPin: string }[];
      } | null;
      if (!response.ok || !body?.ok || !body.pins?.length) {
        setMessage(body?.message || labels.signFailed);
        return;
      }
      const lines = body.pins.map((row) => `${roles[row.role]} ${row.memberNo}: ${row.temporaryPin}`).join(". ");
      setIssued(`${labels.issued} ${body.name}. ${lines}. ${labels.issuedTail}`);
      router.refresh();
    } catch {
      setMessage(labels.signFailed);
    } finally {
      setPending("");
    }
  }

  async function copyIssued() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued);
      setMessage(labels.copied);
    } catch {
      setMessage(labels.signFailed);
    }
  }

  return (
    <section className="card mt-4 p-5">
      <h2 className="font-display text-2xl">{labels.signTitle}</h2>
      <p className="mt-1 text-sm text-muted">{labels.signBody}</p>
      <label className="mt-3 block max-w-xs text-sm font-medium">
        {labels.yourPin}
        <input
          className="field font-mono tracking-[0.2em]"
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
        />
      </label>
      {people.length === 0 ? <p className="mt-4 text-sm text-muted">{labels.signNobody}</p> : null}
      <ul className="mt-4 space-y-3 text-sm">
        {people.map((person) => (
          <li key={person.personId} className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <span>
              <span className="font-medium">{person.name}</span>
              <span className="mt-1 block text-muted">
                {person.roles.map((role) => `${role.memberNo} ${roles[role.role]}`).join(" · ")}
                {" · "}
                {person.locked ? labels.locked : labels.open}
              </span>
            </span>
            <span className="flex flex-wrap gap-2">
              {person.locked ? (
                <button className="btn-line" type="button" disabled={pending === person.personId} onClick={() => unlock(person.personId)}>
                  {pending === person.personId ? labels.unlocking : labels.unlock}
                </button>
              ) : null}
              <button className="btn" type="button" disabled={pending === person.personId} onClick={() => resetPin(person)}>
                {pending === person.personId ? labels.signWorking : labels.newPin}
              </button>
            </span>
          </li>
        ))}
      </ul>
      {issued ? (
        <p className="mt-4 border border-line p-3 font-mono text-sm" role="status">
          {issued}
          <button className="btn-line ml-3" type="button" onClick={copyIssued}>
            {labels.copyPin}
          </button>
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 text-sm text-muted" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
