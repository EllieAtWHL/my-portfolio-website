'use client';

interface GameControlsProps {
  onEndTurn: () => void;
  onUndo: () => void;
  canEndTurn: boolean;
}

export function GameControls({ onEndTurn, onUndo, canEndTurn }: GameControlsProps) {
  return (
    <div className="flex justify-center gap-4">
      <button
        onClick={onUndo}
        className="button secondary"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          <span>Undo</span>
        </div>
      </button>

      <button
        onClick={onEndTurn}
        disabled={!canEndTurn}
        className={`
          button primary
          disabled:opacity-50 disabled:cursor-not-allowed
          ${!canEndTurn ? 'disabled' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          <span>End Turn</span>
        </div>
      </button>
    </div>
  );
}
