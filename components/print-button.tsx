"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      className="no-print tap rounded-full border border-ink/20 px-4 text-sm"
      type="button"
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}
