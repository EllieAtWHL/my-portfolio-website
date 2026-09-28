'use client';

import { useState } from 'react';
import { GameStart } from './microbrew/GameStart';

export default function MicrobrewGame() {
  // Wired to useMicrobrewGame (and the 'playing' screen) in later stories.
  const [gameState] = useState<'start' | 'playing'>('start');

  return (
    <div className="w-full max-w-6xl mx-auto">
      {gameState === 'start' && <GameStart />}
    </div>
  );
}
