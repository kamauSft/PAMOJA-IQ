"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { copy } from "@/content/ui";
import guideScript from "@/content/guide-script.json";

const english = copy("en").guide;

/** The narration is fixed in English; the surrounding page copy is bilingual. */
const SCRIPT: string[] = guideScript;

export function GuideTour({ labels = english }: { labels?: typeof english }) {
  const [open, setOpen] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    void video.current?.play().catch(() => {
      // Autoplay with sound can be refused; the native controls remain available.
    });
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <section id="guide" className="scroll-mt-24 bg-[#EAF7EF] px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-5xl items-center gap-8 rounded-2xl border border-[#CBE4D6] bg-white p-5 shadow-sm md:grid-cols-[1fr_1.1fr] md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#146B3A]">
            {labels.eyebrow}
          </p>
          <h2 className="editorial text-balance mt-2 text-3xl text-[#0B3D24] sm:text-4xl">
            {labels.title}
          </h2>
          <p className="mt-3 text-sm text-muted">{labels.body}</p>
          <button
            className="btn mt-5 rounded-full bg-[#146B3A] text-white"
            type="button"
            onClick={() => setOpen(true)}
          >
            {labels.button}
            <svg
              viewBox="0 0 24 24"
              className="ml-2 h-4 w-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative aspect-video overflow-hidden rounded-xl border border-line bg-navy"
          aria-label={labels.button}
        >
          <Image
            src="/images/guide-poster.webp"
            alt="A presenter explaining Pamoja IQ"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-navy/25" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-navy shadow-lg">
            <svg
              viewBox="0 0 24 24"
              className="ml-1 h-7 w-7"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="absolute bottom-3 left-3 rounded-lg bg-navy/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
            Pamoja IQ · Guide
          </span>
          <span className="absolute bottom-4 right-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">
            {labels.disclosure}
          </span>
        </button>
      </div>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={labels.playing}
            className="w-full max-w-4xl rounded-xl bg-surface p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-1 pb-3">
              <div>
                <p className="text-sm font-semibold text-ink">{labels.playing}</p>
                <p className="text-xs text-muted">{labels.disclosure}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                autoFocus
                className="tap rounded-lg border border-line px-3 py-1 text-sm text-ink"
              >
                {labels.close}
              </button>
            </div>
            <video
              ref={video}
              className="w-full rounded-lg bg-black"
              src="/videos/guide.mp4"
              poster="/images/guide-poster.webp"
              controls
              playsInline
              preload="metadata"
            />
            <details className="mt-3 px-1 pb-1 text-sm text-muted">
              <summary className="cursor-pointer font-semibold text-ink">
                {labels.transcript}
              </summary>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                {SCRIPT.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            </details>
          </div>
        </div>
      ) : null}
    </section>
  );
}
