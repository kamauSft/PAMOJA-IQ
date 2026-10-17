"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GoalForm({
  labels,
  goal,
}: {
  labels: {
    name: string;
    amount: string;
    date: string;
    save: string;
    working: string;
    failed: string;
    saveChange: string;
  };
  goal?: { id: string; title: string; targetShillings: number; targetDate: string };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(goal?.title ?? "");
  const [targetShillings, setTargetShillings] = useState(goal ? String(goal.targetShillings) : "");
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/goals", {
        method: goal ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: goal?.id,
          title,
          targetShillings: Number(targetShillings),
          targetDate,
        }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setMessage(body?.message || labels.failed);
        return;
      }
      if (!goal) {
        setTitle("");
        setTargetShillings("");
        setTargetDate("");
      }
      router.refresh();
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
        <input className="field" name="title" value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="block text-sm font-medium">
        {labels.amount}
        <input
          className="field"
          name="amount"
          inputMode="numeric"
          value={targetShillings}
          onChange={(event) => setTargetShillings(event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        {labels.date}
        <input className="field" name="date" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
      </label>
      <button className="tap rounded-full bg-sisal px-5 text-sm font-semibold text-ink disabled:opacity-60" disabled={pending} type="submit">
        {pending ? labels.working : goal ? labels.saveChange : labels.save}
      </button>
      {message ? (
        <p className="text-sm text-clay" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
