export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect
        x="5.8"
        y="7.7"
        width="8.2"
        height="11"
        rx="2.2"
        transform="rotate(-12 9.9 13.2)"
        fill="currentColor"
        opacity="0.4"
      />
      <rect
        x="9.6"
        y="3.8"
        width="8.2"
        height="11"
        rx="2.2"
        transform="rotate(8 13.7 9.3)"
        fill="currentColor"
      />
    </svg>
  );
}
