'use client';

import { IconButton } from './IconButton';

interface RulesIconButtonProps {
  onClick: () => void;
  className?: string;
}

export function RulesIconButton({ onClick, className = '' }: RulesIconButtonProps) {
  return (
    <IconButton onClick={onClick} label="How to play" className={className}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
        />
      </svg>
    </IconButton>
  );
}
