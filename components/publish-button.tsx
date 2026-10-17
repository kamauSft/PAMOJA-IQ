"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PublishButton({
  label,
  working,
  done,
  already,
  disabled,
}: {
  label: string;
  working: string;
  done: string;
  already: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function publish() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/publish", { method: "POST" });
      const body = (await response.json().catch(() => null)) as { published?: number; members?: number } | null;
      if (!response.ok || !body) {
        setMessage("The positions could not be shared. Try again.");
        return;
      }
      setMessage(body.published ? `${done} ${body.members}.` : already);
      router.refresh();
    } catch {
      setMessage("The positions could not be shared. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        className="btn disabled:opacity-60"
        type="button"
        disabled={disabled || pending}
        onClick={publish}
      >
        {pending ? working : label}
      </button>
      {message ? <p className="mt-3 text-sm text-leaf">{message}</p> : null}
    </div>
  );
}
