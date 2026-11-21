const buckets = new Map<string, number[]>();
const MAX_KEYS = 5_000;

export function resetRateLimits(): void {
  buckets.clear();
}

function sweep(now: number, windowMs: number): void {
  for (const [key, stamps] of buckets) {
    const newest = stamps[stamps.length - 1] ?? 0;
    if (now - newest >= windowMs) buckets.delete(key);
  }
  if (buckets.size < MAX_KEYS) return;
  const oldest = [...buckets.keys()].slice(0, Math.ceil(buckets.size / 2));
  for (const key of oldest) buckets.delete(key);
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { ok: boolean; retryAfterMs: number } {
  const seen = buckets.get(key);
  const recent = seen ? seen.filter((stamp) => now - stamp < windowMs) : [];
  if (recent.length >= limit) {
    buckets.set(key, recent);
    const oldest = recent[0] ?? now;
    return { ok: false, retryAfterMs: Math.max(0, windowMs - (now - oldest)) };
  }
  if (recent.length === 0 && buckets.size >= MAX_KEYS) sweep(now, windowMs);
  recent.push(now);
  buckets.set(key, recent);
  return { ok: true, retryAfterMs: 0 };
}
