/** Diameter in pixels. The largest saver is the biggest circle; an empty balance stays tappable. */
export function bubbleSize(savingsCents: number, peakCents: number): number {
  const peak = Math.max(peakCents, 1);
  const ratio = Math.sqrt(Math.max(savingsCents, 0) / peak);
  return Math.round(56 + ratio * 72);
}

/** Keep a spreadsheet name as a short label. Paths and line breaks are dropped. */
export function importFileLabel(name: string): string {
  const base = name.split(/[/\\]/).pop()?.replace(/[\r\n\t]/g, " ").trim() ?? "";
  return (base || "Excel").slice(0, 80);
}

export function importWhen(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  }).format(date);
}
