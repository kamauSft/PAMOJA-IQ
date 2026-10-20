"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5">
      <h1 className="text-3xl font-semibold">This page did not open</h1>
      <p className="mt-3 text-sm text-muted">
        Try again in a moment.
      </p>
      <button className="btn mt-6 w-fit" type="button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
