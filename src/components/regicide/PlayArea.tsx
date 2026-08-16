'use client';

import { Card as UniversalCard } from '@/components/Card';
import { Button } from '@/components/Button';
import { Card as GameCard } from './Card';
import { Deck } from './Deck';
import { GameControls } from './GameControls';
import { PowerDisplay } from './PowerDisplay';
import { StatsIconButton } from './StatsIconButton';
import {
  cardValue,
  SUIT_POWER_LABEL,
  type GameData,
} from '@/hooks/useRegicideGame';

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
  if (!gameData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading game...</div>
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
    message,
    gameOver,
    victory,
  } = gameData;

  const handValue = playerHand.reduce((sum, c) => sum + cardValue(c.rank), 0);
  const activeAreaCards = [...activeDeck, ...chosenCards];

  return (
    <div className="w-full py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold">Regicide</h2>
          <p className="text-gray-600 dark:text-gray-300">Defeat the Royals!</p>
        </div>

        <StatsIconButton onClick={onShowStats} />
      </div>

      <div className="max-w-7xl mx-auto">
        {gameOver && (
          <UniversalCard variant="accent" className="mb-8 text-center">
            <h3 className="text-2xl font-bold mb-2">
              {victory ? '👑 You won the game!' : '💀 Sorry, you lost'}
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

        {message && !gameOver && (
          <div
            role="status"
            className={`mb-6 rounded-lg px-4 py-3 text-center font-medium ${
              message.tone === 'error'
                ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-l-4 border-red-400'
                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {phase === 'defend' && !gameOver && (
          <div
            role="status"
            className="mb-6 rounded-lg px-4 py-3 text-center font-medium bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-l-4 border-yellow-400"
          >
            The royal is attacking! Discard cards worth at least {defenceRemaining} to defend.
          </div>
        )}

        {/* Royal Area */}
        <div className="mb-12">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold mb-2">Royal Deck</h3>
            <PowerDisplay type="royal" power={royalCard?.attack ?? 0} />
          </div>

          <div className="flex justify-center">
            <Deck
              type="royal"
              count={royalDeck.length}
              className="transform hover:scale-105 transition-transform duration-200"
            />
          </div>
        </div>

        {/* Battle Area */}
        <UniversalCard className="mb-12 dark:!bg-dark-bg-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Current Royal Card */}
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-4">Current Royal</h4>
              <UniversalCard padding="sm" className="dark:!bg-dark-bg-2">
                {royalCard ? (
                  <div className="flex flex-col items-center gap-3">
                    <GameCard suit={royalCard.suit} rank={royalCard.rank} />
                    <div className="w-full">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                        <span>Health</span>
                        <span>
                          {royalCard.health} / {royalCard.maxHealth}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-dark-bg-1 rounded-full h-2">
                        <div
                          className="bg-red-600 dark:bg-red-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(0, (royalCard.health / royalCard.maxHealth) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Immune to: {SUIT_POWER_LABEL[royalCard.suit]}
                    </p>
                  </div>
                ) : (
                  <div className="w-20 h-28 bg-gray-100 dark:bg-dark-bg-1 rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-accent/30 flex items-center justify-center">
                    <span className="text-gray-600 dark:text-gray-300 text-sm">No Royal</span>
                  </div>
                )}
              </UniversalCard>
            </div>

            {/* Cards played this fight */}
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-4">Cards in Play</h4>
              <UniversalCard padding="sm" className="dark:!bg-dark-bg-2">
                {activeAreaCards.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {activeAreaCards.map((card, index) => (
                      <GameCard
                        key={`${card.suit}-${card.rank}-${index}`}
                        suit={card.suit}
                        rank={card.rank}
                        value={cardValue(card.rank)}
                        isSelected={index >= activeDeck.length}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-20 h-28 mx-auto bg-gray-100 dark:bg-dark-bg-1 rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-accent/30 flex items-center justify-center">
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Select Card</span>
                  </div>
                )}
              </UniversalCard>
            </div>

            {/* Tavern Deck */}
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-4">Tavern</h4>
              <UniversalCard padding="sm" className="dark:!bg-dark-bg-2">
                <Deck
                  type="tavern"
                  count={tavernDeck.length}
                  className="transform hover:scale-105 transition-transform duration-200"
                />
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                  Discard pile: {discardPile.length}
                </p>
              </UniversalCard>
            </div>
          </div>
        </UniversalCard>

        {/* Player's Hand */}
        <div className="mb-8">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold mb-2">Your Hand</h3>
            <PowerDisplay type="player" power={handValue} />
          </div>

          <div className="flex justify-center gap-2 flex-wrap">
            {playerHand.map((card, index) => (
              <GameCard
                key={`${card.suit}-${card.rank}-${index}`}
                suit={card.suit}
                rank={card.rank}
                value={cardValue(card.rank)}
                onClick={() => selectHandCard(index)}
                className="transform hover:scale-105 hover:-translate-y-2 transition-all duration-200"
              />
            ))}
          </div>
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
      </div>
    </div>
  );
}
