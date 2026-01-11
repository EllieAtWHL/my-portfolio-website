'use client';

import { useState, useEffect } from 'react';
import { GameStart } from './regicide/GameStart';
import { PlayArea } from './regicide/PlayArea';
import { StatsScreen } from './regicide/StatsScreen';
import { useRegicideGame } from '@/hooks/useRegicideGame';

export default function RegicideGame() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'stats'>('start');
  const { initializeGame, gameData, isLoading, startGame, playCard, drawCard } = useRegicideGame();

  useEffect(() => {
    // Initialize game when component mounts
    initializeGame();
  }, []); // Empty dependency array to prevent infinite re-renders

  const handleStartGame = () => {
    startGame();
    setGameState('playing');
  };

  const handleShowStats = () => {
    setGameState('stats');
  };

  const handleCloseStats = () => {
    setGameState(gameData?.isPlaying ? 'playing' : 'start');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading Regicide...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {gameState === 'start' && (
        <GameStart onStartGame={handleStartGame} onShowStats={handleShowStats} />
      )}
      
      {gameState === 'playing' && (
        <PlayArea 
          gameData={gameData} 
          onShowStats={handleShowStats} 
          playCard={gameData?.gameOver ? undefined : playCard}
          drawCard={gameData?.gameOver ? undefined : drawCard}
        />
      )}
      
      {gameState === 'stats' && (
        <StatsScreen onClose={handleCloseStats} />
      )}
    </div>
  );
}
