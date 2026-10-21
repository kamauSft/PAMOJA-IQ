"use client";

import { useState } from "react";

type AskLabels = {
  open: string;
  close: string;
  memberTitle: string;
  deskTitle: string;
  memberNote: string;
  deskNote: string;
  question: string;
  send: string;
  sending: string;
  failed: string;
  empty: string;
};

export function AskPanel({
  labels,
  desk,
  raised,
}: {
  labels: AskLabels;
  desk: boolean;
  raised: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [turns, setTurns] = useState<{ question: string; answer: string }[]>([]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text) {
      setError(labels.empty);
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const body = (await response.json().catch(() => null)) as { answer?: string; message?: string } | null;
      if (!response.ok || !body?.answer) {
        setError(body?.message || labels.failed);
        return;
      }
      setTurns((current) => [...current, { question: text, answer: body.answer! }]);
      setQuestion("");
    } catch {
      setError(labels.failed);
    } finally {
      setPending(false);
    }
  }

  function fields(id: string, showClose: boolean) {
    return (
      <>
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h2 className="font-display text-2xl">{desk ? labels.deskTitle : labels.memberTitle}</h2>
            <p className="mt-1 text-sm text-muted">{desk ? labels.deskNote : labels.memberNote}</p>
          </div>
          {showClose ? (
            <button type="button" className="btn-line shrink-0" onClick={() => setOpen(false)}>
              {labels.close}
            </button>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {turns.map((turn, index) => (
            <div key={index} className="border-b border-line py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{turn.question}</p>
              <p className="mt-2 text-sm leading-6 text-ink">{turn.answer}</p>
            </div>
          ))}
        </div>
        <form onSubmit={onSubmit} className="border-t border-line px-4 py-3">
          <label className="text-sm font-semibold text-ink" htmlFor={id}>
            {labels.question}
          </label>
          <textarea
            id={id}
            value={question}
            maxLength={400}
            rows={3}
            onChange={(event) => setQuestion(event.target.value)}
            className="mt-2 w-full border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
          {error ? <p className="mt-2 text-sm text-overdue">{error}</p> : null}
          <button type="submit" className="btn mt-3 w-full" disabled={pending}>
            {pending ? labels.sending : labels.send}
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      {open ? null : (
        <button
          type="button"
          className={`no-print tap fixed right-3 z-40 border border-line bg-[var(--action)] px-4 text-sm font-semibold text-[var(--on-action)] md:hidden ${raised ? "bottom-20" : "bottom-4"}`}
          onClick={() => setOpen(true)}
        >
          {labels.open}
        </button>
      )}
      {open ? (
        <aside
          className={`no-print fixed right-0 z-30 flex w-full flex-col border-l border-line bg-surface md:hidden ${raised ? "bottom-16 top-0" : "inset-y-0"}`}
        >
          {fields("ask-question-phone", true)}
        </aside>
      ) : null}
      <aside
        className={`no-print sticky top-0 hidden w-[22rem] shrink-0 flex-col border-l border-line bg-surface md:flex ${raised ? "h-[calc(100vh-4.5rem)]" : "h-screen"}`}
      >
        {fields("ask-question-desk", false)}
      </aside>
    </>
  );
}
