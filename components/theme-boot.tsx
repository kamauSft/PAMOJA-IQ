export function ThemeBoot() {
  const script = `(function(){try{var t=localStorage.getItem("theme");var dark=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(dark)document.documentElement.classList.add("dark");}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
