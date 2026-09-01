/* NotesSync brand — geometric open-notebook / connected-pages mark.
   Uses the same `--accent` / `--accent-fg` tokens as the landing page so it
   adapts to light/dark, with a muted teal connection node as the accent. */

export const BrandMark = ({ size = 28, className = '' }) => (
  <span
    className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
    style={{ width: size, height: size }}
    aria-hidden
  >
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
      <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="var(--accent)" />
      <rect x="1.5" y="1.5" width="29" height="29" rx="9" stroke="var(--accent-fg)" strokeOpacity="0.14" />
      {/* left page */}
      <path
        d="M10 9.4h4.2a.7.7 0 0 1 .7.7v12.5a.7.7 0 0 1-.7.7H10a2.1 2.1 0 0 0-2.1 2.1V11.5A2.1 2.1 0 0 1 10 9.4Z"
        fill="var(--accent-fg)"
      />
      {/* right page */}
      <path
        d="M22 9.4h-4.2a.7.7 0 0 0-.7.7v12.5a.7.7 0 0 0 .7.7H22a2.1 2.1 0 0 1 2.1 2.1V11.5A2.1 2.1 0 0 0 22 9.4Z"
        fill="var(--accent-fg)"
      />
      {/* spine */}
      <path d="M16 10.1v12.6" stroke="var(--accent)" strokeWidth="1.1" strokeLinecap="round" />
      {/* ruled lines on left page */}
      <path d="M12.2 13h3.1M12.2 15.7h3.1" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" />
      {/* muted teal connection node */}
      <circle cx="23.3" cy="12.4" r="1.8" fill="var(--accent-teal)" />
    </svg>
  </span>
);

export const BrandLockup = ({
  size = 28,
  className = '',
  markClassName = '',
  compact = false,
  wordmark = 'NotesSync',
  wordmarkClassName = '',
}) => (
  <span className={`inline-flex items-center gap-2.5 min-w-0 ${className}`}>
    <BrandMark size={size} className={markClassName} />
    {!compact && (
      <span
        className={`font-display text-[17px] leading-none tracking-tight truncate ${
          wordmarkClassName || 'text-(--text)'
        }`}
      >
        {wordmark}
      </span>
    )}
  </span>
);

export default BrandMark;
