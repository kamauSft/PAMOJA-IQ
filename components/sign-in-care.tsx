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
    lock: string;
    locking: string;
    lockedNow: string;
    remove: string;
    removing: string;
    removed: string;
    removeAsk: string;
  };
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [issuedName, setIssuedName] = useState("");
  const [issuedPins, setIssuedPins] = useState<{ role: MembershipRole; memberNo: string; temporaryPin: string }[]>([]);
  const [pending, setPending] = useState("");

  async function unlock(personId: string) {
    setPending(personId);
    setMessage("");
    setIssuedPins([]);
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
    setIssuedPins([]);
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
      setIssuedName(body.name ?? "");
      setIssuedPins(body.pins);
      router.refresh();
    } catch {
      setMessage(labels.signFailed);
    } finally {
      setPending("");
    }
  }

  async function hold(personId: string) {
    setPending(personId);
    setMessage("");
    setIssuedPins([]);
    try {
      const response = await fetch("/api/members/lock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ personId, pin }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      setMessage(response.ok && body?.ok ? labels.lockedNow : body?.message || labels.signFailed);
      if (response.ok && body?.ok) router.refresh();
    } catch {
      setMessage(labels.signFailed);
    } finally {
      setPending("");
    }
  }

  async function remove(person: SignInPerson) {
    if (!window.confirm(labels.removeAsk)) return;
    setPending(person.personId);
    setMessage("");
    setIssuedPins([]);
    try {
      const response = await fetch("/api/members/remove", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ personId: person.personId, pin }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      setMessage(response.ok && body?.ok ? labels.removed : body?.message || labels.signFailed);
      if (response.ok && body?.ok) router.refresh();
    } catch {
      setMessage(labels.signFailed);
    } finally {
      setPending("");
    }
  }

  async function copyIssued() {
    if (issuedPins.length === 0) return;
    const text = issuedPins.map((row) => `${roles[row.role]} ${row.memberNo}: ${row.temporaryPin}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
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
              ) : (
                <button className="btn-line" type="button" disabled={pending === person.personId} onClick={() => hold(person.personId)}>
                  {pending === person.personId ? labels.locking : labels.lock}
                </button>
              )}
              <button className="btn" type="button" disabled={pending === person.personId} onClick={() => resetPin(person)}>
                {pending === person.personId ? labels.signWorking : labels.newPin}
              </button>
              <button className="btn-line" type="button" disabled={pending === person.personId} onClick={() => remove(person)}>
                {pending === person.personId ? labels.removing : labels.remove}
              </button>
            </span>
          </li>
        ))}
      </ul>
      {issuedPins.length > 0 ? (
        <div className="mt-4 border border-line p-4" role="status">
          <p className="text-sm text-muted">
            {labels.issued} {issuedName}
          </p>
          {issuedPins.map((row) => (
            <p key={`${row.role}-${row.memberNo}`} className="mt-2">
              <span className="block text-sm text-muted">
                {roles[row.role]} {row.memberNo}
              </span>
              <span className="font-mono text-3xl tracking-[0.18em]">{row.temporaryPin}</span>
            </p>
          ))}
          <p className="mt-2 text-sm text-muted">{labels.issuedTail}</p>
          <button className="btn-line mt-3" type="button" onClick={copyIssued}>
            {labels.copyPin}
          </button>
        </div>
      ) : null}
      {message ? (
        <p className="mt-3 text-sm text-muted" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
