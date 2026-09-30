'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  brewSwap as brewSwapTransition,
  createNewGame,
  endBrew as endBrewTransition,
  getRecipeBacks,
  returnRecipe as returnRecipeTransition,
  swapSetupHop as swapSetupHopTransition,
  type CopperSlot,
  type GameState,
} from '@/lib/microbrew/game';
import type { BeerColour } from '@/lib/microbrew/data';

export type {
  BoardState,
  BrewmasterSpace,
  BrewState,
  Copper,
  CopperSlot,
  CopperToken,
  GamePhase,
  GameState,
  PlayerIndex,
  PlayerState,
} from '@/lib/microbrew/game';

// Like useRegicideGame, this hook owns all game state and actions and is used
// exactly once, by MicrobrewGame. The rules themselves are pure functions in
// src/lib/microbrew/game.ts; this hook just holds the state and applies them.
export function useMicrobrewGame() {
  const [game, setGame] = useState<GameState | null>(null);

  const startGame = useCallback((playerOneName: string, playerTwoName: string) => {
    setGame(createNewGame(playerOneName, playerTwoName));
  }, []);

  /** Abandons the current game and returns to the start screen. */
  const resetGame = useCallback(() => setGame(null), []);

  const returnRecipe = useCallback((recipeId: string) => {
    setGame((current) => (current ? returnRecipeTransition(current, recipeId) : current));
  }, []);

  const swapSetupHop = useCallback((target: CopperSlot) => {
    setGame((current) => (current ? swapSetupHopTransition(current, target) : current));
  }, []);

  const brewSwap = useCallback((from: CopperSlot, to: CopperSlot) => {
    setGame((current) => (current ? brewSwapTransition(current, from, to) : current));
  }, []);

  const endBrew = useCallback(() => {
    setGame((current) => (current ? endBrewTransition(current) : current));
  }, []);

  /** Public: each player's recipe card backs (colour tiers), per player index. */
  const recipeBacks = useMemo<[BeerColour[], BeerColour[]] | null>(
    () => (game ? [getRecipeBacks(game.players[0]), getRecipeBacks(game.players[1])] : null),
    [game],
  );

  return { game, recipeBacks, startGame, resetGame, returnRecipe, swapSetupHop, brewSwap, endBrew };
}
