'use client';

import { Button } from '@/components/Button';
import type { GamePhase } from '@/hooks/useRegicideGame';

interface GameControlsProps {
  phase: GamePhase;
  onAttack: () => void;
  canAttack: boolean;
  onUseJester: () => void;
  jestersRemaining: number;
  onUndo: () => void;
  canUndo: boolean;
}

export function GameControls({
  phase,
  onAttack,
  canAttack,
  onUseJester,
  jestersRemaining,
  onUndo,
  canUndo,
}: GameControlsProps) {
  const buttonClasses =
    'inline-flex items-center justify-center gap-2 w-44 whitespace-nowrap leading-none font-normal disabled:hover:[transform:none] disabled:active:[transform:none]';

  return (
    <div className="flex justify-center flex-wrap gap-4">
      {phase === 'attack' && (
        <Button variant="primary" onClick={onAttack} disabled={!canAttack} className={buttonClasses}>
          <svg className="w-5 h-5 flex-shrink-0 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Attack
        </Button>
      )}

      <Button variant="secondary" onClick={onUseJester} disabled={jestersRemaining < 1} className={buttonClasses}>
        <svg className="w-5 h-5 flex-shrink-0 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="4" y="3" width="16" height="18" rx="2" strokeWidth={2} />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8l1.2 2.4 2.6.4-1.9 1.8.4 2.6L12 14l-2.3 1.2.4-2.6-1.9-1.8 2.6-.4L12 8z"
          />
        </svg>
        Use Jester ({jestersRemaining})
      </Button>

      <Button variant="secondary" onClick={onUndo} disabled={!canUndo} className={buttonClasses}>
        <svg className="w-5 h-5 flex-shrink-0 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Undo
      </Button>
    </div>
  );
}
