export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="currentColor" />
      <path d="M11 8h7.2c3.4 0 5.5 2 5.5 4.8S21.6 17.6 18.2 17.6H14.2V24" stroke="white" strokeWidth="1.8" fill="none" />
    </svg>
  );
}
