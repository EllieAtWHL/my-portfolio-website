'use client';

import { useState } from 'react';
import { Card as UniversalCard } from '@/components/Card';
import { Card as GameCard } from './Card';
import { Deck } from './Deck';
import { GameControls } from './GameControls';
import { PowerDisplay } from './PowerDisplay';

interface PlayAreaProps {
  gameData?: any;
  onShowStats: () => void;
  playCard?: (cardIndex: number) => void;
  drawCard?: () => void;
}

export function PlayArea({ gameData, onShowStats, playCard, drawCard }: PlayAreaProps) {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  if (!gameData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold">Regicide</h2>
          <p className="text-gray-600 dark:text-gray-300">Defeat the Royals!</p>
        </div>
        
        <button
          onClick={onShowStats}
          className="button secondary"
          aria-label="View Statistics"
        >
          📊 Stats
        </button>
      </div>

      {/* Game Board */}
      <div className="max-w-7xl mx-auto">
        {/* Royal Area */}
        <div className="mb-12">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold mb-2">Royal Deck</h3>
            <PowerDisplay type="royal" power={gameData.royalPower} />
          </div>
          
          <div className="flex justify-center">
            <Deck 
              type="royal" 
              count={gameData.royalDeck.length}
              className="transform hover:scale-105 transition-transform duration-200"
            />
          </div>
        </div>

        {/* Battle Area */}
        <UniversalCard className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Current Royal Card */}
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-4">Current Royal</h4>
              <UniversalCard padding="sm">
                {gameData.currentRoyal ? (
                  <GameCard 
                    suit={gameData.currentRoyal.suit as any}
                    rank={gameData.currentRoyal.rank}
                    power={gameData.currentRoyal.power}
                    onClick={() => {}}
                    className="transform hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-20 h-28 bg-gray-100 dark:bg-gray-600 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-500 flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-500 text-sm">No Royal</span>
                  </div>
                )}
              </UniversalCard>
            </div>

            {/* Player's Current Card */}
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-4">Your Card</h4>
              <UniversalCard padding="sm">
                {gameData.playerHand.length > 0 && selectedCard !== null ? (
                  <GameCard 
                    suit={gameData.playerHand[selectedCard]?.suit as any}
                    rank={gameData.playerHand[selectedCard]?.rank}
                    power={gameData.playerHand[selectedCard]?.power}
                    onClick={() => setSelectedCard(selectedCard)}
                    isSelected={true}
                    className="cursor-pointer transform hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-20 h-28 bg-gray-100 dark:bg-gray-600 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-500 flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-500 text-sm">Select Card</span>
                  </div>
                )}
              </UniversalCard>
            </div>

            {/* Tavern Deck */}
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-4">Tavern</h4>
              <UniversalCard padding="sm">
                <Deck 
                  type="tavern" 
                  count={gameData.tavernDeck.length}
                  className="transform hover:scale-105 transition-transform duration-200"
                />
              </UniversalCard>
            </div>
          </div>
        </UniversalCard>

        {/* Player's Hand */}
        <div className="mb-8">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold mb-2">Your Hand</h3>
            <PowerDisplay type="player" power={gameData.playerPower} />
          </div>
          
          <div className="flex justify-center gap-2 flex-wrap">
            {gameData.playerHand.map((card: any, index: number) => (
              <GameCard
                key={index}
                suit={card.suit as any}
                rank={card.rank}
                power={card.power}
                onClick={() => {
              setSelectedCard(index);
              if (playCard) {
                playCard(index);
              }
            }}
                isSelected={selectedCard === index}
                className="transform hover:scale-105 hover:-translate-y-2 transition-all duration-200"
              />
            ))}
          </div>
        </div>

        {/* Game Controls */}
        <GameControls 
          onEndTurn={() => drawCard && drawCard()}
          onUndo={() => console.log('Undo action')}
          canEndTurn={selectedCard !== null}
        />
      </div>
    </div>
  );
}
