interface LegacyNumberBadgeProps {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Original shield motif (not the club crest) so this reads as this site's own
// design language rather than official Spurs branding - see CLAUDE.md's
// fan-site guardrails.
const SHIELD_PATH = 'M12 1 L22 4.6 V13 C22 20.3 17.6 25.4 12 27.4 C6.4 25.4 2 20.3 2 13 V4.6 Z';

const SIZES: Record<NonNullable<LegacyNumberBadgeProps['size']>, { width: number; height: number; fontSize: number }> = {
  sm: { width: 20, height: 24, fontSize: 10 },
  md: { width: 32, height: 38, fontSize: 15 },
  lg: { width: 52, height: 62, fontSize: 24 },
};

export default function LegacyNumberBadge({ number, size = 'md', className = '' }: LegacyNumberBadgeProps) {
  const { width, height, fontSize } = SIZES[size];

  return (
    <span
      className={`legacy-number-badge ${className}`.trim()}
      style={{ width, height }}
      role="img"
      aria-label={`Legacy number ${number}`}
      title={`Legacy Number ${number}`}
    >
      <svg viewBox="0 0 24 28" className="legacy-number-badge__shape" aria-hidden="true">
        <path d={SHIELD_PATH} />
      </svg>
      <span className="legacy-number-badge__number" style={{ fontSize }}>
        {number}
      </span>
    </span>
  );
}
