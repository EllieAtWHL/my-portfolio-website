import { useId } from 'react';

interface LegacyNumberBadgeProps {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Original shield motif (not the club crest) so this reads as this site's own
// design language rather than official Spurs branding - see CLAUDE.md's
// fan-site guardrails.
const SHIELD_PATH = 'M12 1 L22 4.6 V13 C22 20.3 17.6 25.4 12 27.4 C6.4 25.4 2 20.3 2 13 V4.6 Z';

// Sized to comfortably fit a 3-digit legacy number (e.g. Kit Graham's 101)
// at full font size, so every badge is the same fixed size regardless of
// how many digits its number has - see WEB-142 follow-up feedback that a
// per-digit-count shrink made "sm" numbers too small to read, and that
// variable-width badges weren't wanted either.
const SIZES: Record<NonNullable<LegacyNumberBadgeProps['size']>, { width: number; height: number; fontSize: number }> = {
  sm: { width: 26, height: 30, fontSize: 10 },
  md: { width: 38, height: 44, fontSize: 15 },
  lg: { width: 61, height: 71, fontSize: 24 },
};

export default function LegacyNumberBadge({ number, size = 'md', className = '' }: LegacyNumberBadgeProps) {
  const { width, height, fontSize } = SIZES[size];
  const gradientId = `legacy-number-badge-gradient-${useId()}`;

  return (
    <span
      className={`legacy-number-badge ${className}`.trim()}
      style={{ width, height }}
      role="img"
      aria-label={`Legacy number ${number}`}
      title={`Legacy Number ${number}`}
    >
      <svg viewBox="0 0 24 28" className="legacy-number-badge__shape" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--spurs-primary-dark)" />
            <stop offset="100%" stopColor="var(--spurs-primary-darker)" />
          </linearGradient>
        </defs>
        <path d={SHIELD_PATH} fill={`url(#${gradientId})`} />
      </svg>
      <span className="legacy-number-badge__number" style={{ fontSize }}>
        {number}
      </span>
    </span>
  );
}
