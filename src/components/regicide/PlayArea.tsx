'use client';

import { useEffect, useRef, useState } from 'react';
import { Card as UniversalCard } from '@/components/Card';
import { Button } from '@/components/Button';
import { Card as GameCard } from './Card';
import { Deck } from './Deck';
import { GameControls } from './GameControls';
import { StatsIconButton } from './StatsIconButton';
import { ToastContainer } from './ToastContainer';
import { useToasts } from '@/hooks/useToasts';
import { compareHandCards, SUIT_POWER_LABEL, type GameData, type GameMessage } from '@/hooks/useRegicideGame';

interface PlayAreaProps {
  gameData?: GameData;
  onShowStats: () => void;
  selectHandCard: (index: number) => void;
  attack: () => void;
  useJester: () => void;
  undo: () => void;
  canUndo: boolean;
  onRestart: () => void;
}

export function PlayArea({
  gameData,
  onShowStats,
  selectHandCard,
  attack,
  useJester,
  undo,
  canUndo,
  onRestart,
}: PlayAreaProps) {
  const { toasts, push, dismiss } = useToasts();
  const lastMessageRef = useRef<GameMessage | null>(null);
  // Display-only preference: the original vanilla implementation always
  // auto-sorted the hand, but that hid the order cards were drawn in - this
  // makes it an opt-in toggle instead. Sorting reorders the rendered cards
  // only; each still calls selectHandCard with its real position in
  // gameData.playerHand, so the underlying game state is untouched.
  const [sortHand, setSortHand] = useState(false);

  useEffect(() => {
    const message = gameData?.message;
    if (!message || message === lastMessageRef.current) return;
    lastMessageRef.current = message;
    // A single game action can report several sub-events at once (e.g. a
    // suit power plus the attack itself) - the hook joins them into one
    // string, so split them back out into their own stacked toasts to match
    // the original's behaviour of firing one Toast per sub-event.
    message.text.split(' · ').forEach((text) => push(text, message.tone));
  }, [gameData?.message, push]);

  if (!gameData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading game...</div>
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </div>
    );
  }

  const {
    phase,
    royalCard,
    royalDeck,
    tavernDeck,
    playerHand,
    chosenCards,
    activeDeck,
    discardPile,
    jestersRemaining,
    defenceRemaining,
    gameOver,
    victory,
  } = gameData;

  const activeAreaCards = [...activeDeck, ...chosenCards];
  const handOrder = sortHand
    ? playerHand.map((_, index) => index).sort((a, b) => compareHandCards(playerHand[a], playerHand[b]))
    : playerHand.map((_, index) => index);

  return (
    <div className="w-full pt-0 pb-1.5">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-bold">Regicide</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Defeat the Royals!</p>
        </div>

        <StatsIconButton onClick={onShowStats} />
      </div>

      <div className="max-w-7xl mx-auto">
        {gameOver && (
          <UniversalCard variant="accent" className="mb-8 text-center">
            <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              {victory ? (
                <svg className="w-7 h-7 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l4 4 5-8 5 8 4-4-2 11H5L3 8z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l-6 6m0-6l6 6" />
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
          </UniversalCard>
        )}

        {/* Royals (deck + current royal) | Tavern (draw pile + discard pile) -
            two combined groups, matching the original's single draw-container
            row where the deck sits next to the current royal, and the discard
            slot sits next to the draw deck. */}
        <div className="mb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Royals: deck pile + current royal */}
            <div className="text-center">
              <UniversalCard padding="sm" className="h-full dark:!bg-dark-bg-2">
                <h4 className="text-sm font-semibold mb-1 -mt-3 text-gray-600 dark:text-gray-300">Royals</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  {royalCard ? `Immune to: ${SUIT_POWER_LABEL[royalCard.suit]}` : ' '}
                </p>
                <div className="flex items-start justify-center gap-4">
                  <div className="flex flex-col items-center gap-3">
                    <Deck type="royal" count={royalDeck.length} />
                    {royalCard && (
                      <div className="w-28">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-0.5">
                          <span>Attack</span>
                          <span>
                            {royalCard.attack} / {royalCard.maxAttack}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-dark-bg-1 rounded-full h-1.5">
                          <div
                            className="bg-amber-600 dark:bg-amber-400 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(0, Math.min(100, (royalCard.attack / royalCard.maxAttack) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {royalCard ? (
                    <div className="flex flex-col items-center gap-3">
                      <GameCard suit={royalCard.suit} rank={royalCard.rank} />
                      <div className="w-28">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-0.5">
                          <span>Health</span>
                          <span>
                            {royalCard.health} / {royalCard.maxHealth}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-dark-bg-1 rounded-full h-1.5">
                          <div
                            className="bg-red-600 dark:bg-red-400 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(0, (royalCard.health / royalCard.maxHealth) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-28 h-40 bg-gray-100 dark:bg-dark-bg-1 rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-accent/30 flex items-center justify-center">
                      <span className="text-gray-600 dark:text-gray-300 text-sm">No Royal</span>
                    </div>
                  )}
                </div>
              </UniversalCard>
            </div>

            {/* Tavern: draw pile + discard pile */}
            <div className="text-center">
              <UniversalCard padding="sm" className="h-full dark:!bg-dark-bg-2">
                <h4 className="text-sm font-semibold mb-1 -mt-3 text-gray-600 dark:text-gray-300">Tavern</h4>
                <p className="text-xs mb-1" aria-hidden="true">
                  {' '}
                </p>
                <div className="flex items-start justify-center gap-4">
                  <div className="flex flex-col items-center gap-3">
                    <Deck type="tavern" count={tavernDeck.length} />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Draw pile</span>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    {discardPile[0] ? (
                      <GameCard suit={discardPile[0].suit} rank={discardPile[0].rank} />
                    ) : (
                      <div className="w-28 h-40 bg-gray-100 dark:bg-dark-bg-1 rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-accent/30 flex items-center justify-center">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Discard Pile</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-300">Discard ({discardPile.length})</span>
                  </div>
                </div>
              </UniversalCard>
            </div>
          </div>
        </div>

        {/* Cards played this fight - its own slim row below the royal row,
            not a heavy padded column alongside it. */}
        <div className="mb-3 text-center">
          <h4
            role={phase === 'defend' && !gameOver ? 'status' : undefined}
            className={`text-sm font-semibold mb-1 ${
              phase === 'defend' && !gameOver
                ? 'text-[var(--warning-text)] dark:text-[var(--warning-dark-text)]'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {phase === 'defend' && !gameOver
              ? `Discard cards worth at least ${defenceRemaining} to defend!`
              : 'Cards in Play'}
          </h4>
          {activeAreaCards.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2">
              {activeAreaCards.map((card, index) => (
                <GameCard
                  key={`${card.suit}-${card.rank}-${index}`}
                  suit={card.suit}
                  rank={card.rank}
                  isSelected={index >= activeDeck.length}
                  className={index < activeDeck.length ? 'opacity-60' : ''}
                />
              ))}
            </div>
          ) : (
            <div className="w-28 h-40 mx-auto bg-gray-100 dark:bg-dark-bg-1 rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-accent/30 flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-300 text-sm">No Cards Played</span>
            </div>
          )}
        </div>

        {/* Game Controls */}
        {!gameOver && (
          <GameControls
            phase={phase}
            onAttack={attack}
            canAttack={phase === 'attack' && chosenCards.length > 0}
            onUseJester={useJester}
            jestersRemaining={jestersRemaining}
            onUndo={undo}
            canUndo={canUndo}
          />
        )}

        {/* Player's Hand */}
        <div className="mb-0 mt-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-center text-gray-600 dark:text-gray-300">Your Hand</h3>
            <button
              type="button"
              onClick={() => setSortHand((prev) => !prev)}
              aria-pressed={sortHand}
              className={`text-xs leading-none font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                sortHand
                  ? 'bg-[var(--brand-primary-dark)] border-[var(--brand-primary-dark)] text-[var(--bg-light-1)] dark:bg-[var(--dark-accent)] dark:border-[var(--dark-accent)] dark:text-[var(--dark-text-darker)]'
                  : 'bg-transparent border-[var(--brand-primary-dark)]/40 text-[var(--brand-primary-darker)] dark:border-[var(--dark-accent)]/40 dark:text-[var(--dark-text)] hover:border-[var(--brand-primary-dark)] dark:hover:border-[var(--dark-accent)]'
              }`}
            >
              Sort by suit
            </button>
          </div>

          {playerHand.length > 0 ? (
            <div className="flex justify-center gap-2 flex-wrap">
              {handOrder.map((handIndex) => {
                const card = playerHand[handIndex];
                return (
                  <GameCard
                    key={`${card.suit}-${card.rank}-${handIndex}`}
                    suit={card.suit}
                    rank={card.rank}
                    showValue
                    onClick={() => selectHandCard(handIndex)}
                    className="transform hover:scale-105 hover:-translate-y-2 transition-all duration-200"
                  />
                );
              })}
            </div>
          ) : (
            <div className="w-28 h-40 mx-auto bg-gray-100 dark:bg-dark-bg-1 rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-accent/30 flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-300 text-sm text-center">No Cards in Hand</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
