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
  return (
    <div className="flex justify-center flex-wrap gap-4">
      {phase === 'attack' && (
        <Button variant="primary" onClick={onAttack} disabled={!canAttack}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Attack
        </Button>
      )}

      <Button variant="secondary" onClick={onUseJester} disabled={jestersRemaining < 1}>
        🃏 Use Jester ({jestersRemaining} left)
      </Button>

      <Button variant="secondary" onClick={onUndo} disabled={!canUndo}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Undo
      </Button>
    </div>
  );
}
