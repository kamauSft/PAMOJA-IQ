"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", margin: "2rem" }}>
        <h1>Pamoja IQ hit a problem</h1>
        <p>Double-click start-pamoja.bat, wait until that window says it is running, then try again.</p>
        <button type="button" onClick={() => reset()}>
          Try again
        </button>
      </body>
    </html>
  );
}
