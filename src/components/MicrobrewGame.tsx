'use client';

import { useMicrobrewGame } from '@/hooks/useMicrobrewGame';
import { GameStart } from './microbrew/GameStart';
import { GameScreen } from './microbrew/GameScreen';

interface MicrobrewGameProps {
  /** False on the live site until launch - see isMicrobrewPlayable. */
  playable: boolean;
}

export default function MicrobrewGame({ playable }: MicrobrewGameProps) {
  const { game, recipeBacks, startGame, resetGame, returnRecipe, swapSetupHop, brewSwap, endBrew } =
    useMicrobrewGame();

  return (
    <div className="w-full max-w-6xl mx-auto">
      {game && recipeBacks ? (
        <GameScreen
          game={game}
          recipeBacks={recipeBacks}
          onReturnRecipe={returnRecipe}
          onSwapHop={swapSetupHop}
          onBrewSwap={brewSwap}
          onEndBrew={endBrew}
          onNewGame={resetGame}
        />
      ) : (
        <GameStart onStartGame={playable ? startGame : undefined} />
      )}
    </div>
  );
}
