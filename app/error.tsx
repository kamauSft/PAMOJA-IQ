"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-16">
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-sisal">Pamoja IQ</p>
      <h1 className="mt-2 text-3xl font-semibold">Something went wrong.</h1>
      <p className="mt-4 text-sm text-muted">
        Double-click start-pamoja.bat and leave that window open. Then try this page again.
      </p>
      <button
        className="tap mt-6 w-fit rounded-full bg-sisal px-5 text-sm font-semibold text-ink"
        type="button"
        onClick={() => reset()}
      >
        Try again
      </button>
    </main>
  );
}
