interface ChevronIconProps {
  direction: 'left' | 'right';
  className?: string;
}

/** Shared left/right chevron used by the various prev/next navigation controls. */
export function ChevronIcon({ direction, className = 'w-6 h-6' }: ChevronIconProps) {
  const path = direction === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7';

  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );
}
