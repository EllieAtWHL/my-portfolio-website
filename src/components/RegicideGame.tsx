'use client';

import { useState, useEffect } from 'react';
import { GameStart } from './regicide/GameStart';
import { PlayArea } from './regicide/PlayArea';
import { StatsScreen } from './regicide/StatsScreen';
import { RulesModal } from './regicide/RulesModal';
import { useRegicideGame } from '@/hooks/useRegicideGame';

export default function RegicideGame() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'stats'>('start');
  // An overlay, not another gameState screen: opening the rules mid-game
  // must leave the play area (and its toasts/sort toggle) mounted underneath.
  const [showRules, setShowRules] = useState(false);
  const {
    initializeGame,
    gameData,
    isLoading,
    startGame,
    selectHandCard,
    attack,
    useJester,
    undo,
    canUndo,
  } = useRegicideGame();

  useEffect(() => {
    // Initialize game when component mounts
    initializeGame();
  }, [initializeGame]);

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
        <GameStart onStartGame={handleStartGame} onShowStats={handleShowStats} onShowRules={() => setShowRules(true)} />
      )}

      {gameState === 'playing' && (
        <PlayArea
          gameData={gameData}
          onShowStats={handleShowStats}
          onShowRules={() => setShowRules(true)}
          selectHandCard={selectHandCard}
          attack={attack}
          useJester={useJester}
          undo={undo}
          canUndo={canUndo}
          onRestart={handleStartGame}
        />
      )}

      {gameState === 'stats' && (
        <StatsScreen onClose={handleCloseStats} />
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
