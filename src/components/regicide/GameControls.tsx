'use client';

import { Button } from '@/components/Button';

interface GameControlsProps {
  onEndTurn: () => void;
  onUndo: () => void;
  canEndTurn: boolean;
}

export function GameControls({ onEndTurn, onUndo, canEndTurn }: GameControlsProps) {
  return (
    <div className="flex justify-center gap-4">
      <Button
        variant="secondary"
        onClick={onUndo}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Undo
      </Button>

      <Button
        variant="primary"
        onClick={onEndTurn}
        disabled={!canEndTurn}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
        End Turn
      </Button>
    </div>
  );
}
