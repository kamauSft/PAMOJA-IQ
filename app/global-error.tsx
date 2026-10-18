"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-16">
          <h1 className="text-3xl font-semibold">Pamoja IQ hit a problem.</h1>
          <p className="mt-4 text-sm">Double-click start-pamoja.bat and leave that window open.</p>
          <button type="button" onClick={() => reset()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
