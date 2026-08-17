'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/Button';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface GameOverModalProps {
  victory: boolean;
  onRestart: () => void;
  onShowStats: () => void;
}

// An overlay rather than a card in the page flow: the win/lose card used to
// sit above the board and push the whole page taller, reintroducing the
// forced scroll the rest of this session's fixes were trying to eliminate.
// Dismissible via the close button, backdrop click, or Escape, so a player
// can inspect the finished board without being forced into Play Again -
// `isOpen` is local state (not tied to gameData.gameOver) so it resets fresh
// each time PlayArea mounts a new instance of this component for a new
// game-over.
export function GameOverModal({ victory, onRestart, onShowStats }: GameOverModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const titleId = useId();
  const containerRef = useFocusTrap<HTMLDivElement>(isOpen, () => setIsOpen(false));

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- click-outside-to-close backdrop; Escape (handled by useFocusTrap on the dialog below) is the keyboard equivalent, not a key event on this div
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- only stops the backdrop's close click from bubbling, not a real interactive handler */}
      <div
        ref={containerRef}
        className="modal-content max-w-md text-center"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="flex justify-end -mt-2 -mr-2 mb-1">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
            className="p-2 bg-gray-100 dark:bg-dark-bg-2 text-gray-700 dark:text-dark-text rounded-xl hover:bg-gray-200 dark:hover:bg-dark-bg-1 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h3 id={titleId} className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          {victory ? (
            <svg className="w-7 h-7 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l4 4 5-8 5 8 4-4-2 11H5L3 8z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 20v2h8v-2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m12.5 17-.5-1-.5 1h1z" />
              <circle cx="9" cy="12" r="1" />
              <circle cx="15" cy="12" r="1" />
            </svg>
          )}
          {victory ? 'You won the game!' : 'Sorry, you lost'}
        </h3>
        <div className="flex justify-center gap-4 mt-4">
          <Button variant="primary" onClick={onRestart}>
            Play Again
          </Button>
          <Button variant="secondary" onClick={onShowStats}>
            View Stats
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
