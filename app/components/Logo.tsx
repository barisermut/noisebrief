/** Noisebrief mark: an "N" with sound waves. Decorative; pair it with a visible or aria label. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M7 6H11.5L16 13.5V6H20.5V26H16.5L11.5 17.5V26H7V6Z" fill="#00d4aa" />
      <path d="M22 11 Q25 13.5 25 16 Q25 18.5 22 21" stroke="#00d4aa" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <path d="M23.5 8.5 Q28 12 28 16 Q28 20 23.5 23.5" stroke="#00d4aa" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M25 6 Q31 10.5 31 16 Q31 21.5 25 26" stroke="#00d4aa" strokeWidth="1" strokeLinecap="round" opacity="0.25" />
    </svg>
  );
}
