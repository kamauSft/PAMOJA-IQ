export function ThemeBoot({ nonce }: { nonce?: string }) {
  const script = `(function(){try{var t=localStorage.getItem("theme");var dark=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(dark)document.documentElement.classList.add("dark");}catch(e){}})();`;
  // The browser hides a nonce value from JavaScript, so React sees an empty
  // attribute on the client and warns about a mismatch it can never reconcile.
  // The script still carries the nonce; only the warning is silenced.
  return <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: script }} />;
}
