export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="card p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </article>
  );
}
