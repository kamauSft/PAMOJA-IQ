export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#0E1F1A" />
      <path d="M10 22h44M10 32h44M10 42h44M18 12v40M32 12v40M46 12v40" stroke="#1F6B4F" strokeWidth="1.25" opacity="0.85" />
      <path d="M12 16c12 8 28 8 40 0M12 48c12-8 28-8 40 0" stroke="#D9A441" strokeWidth="1.25" fill="none" opacity="0.9" />
      <path
        d="M22 16h14.5c7.2 0 11.5 4.4 11.5 10.2S43.7 36.5 36.5 36.5H28V48"
        stroke="#F6F1E7"
        strokeWidth="3.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 16v32" stroke="#D9A441" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
