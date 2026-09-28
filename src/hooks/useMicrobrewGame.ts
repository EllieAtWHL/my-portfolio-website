'use client';

import { useCallback, useState } from 'react';
import type { Customer, Recipe, ReputationCard, TokenType } from '@/lib/microbrew/data';

// Skeleton only (WEB-178). The full GameState field list, dealing and setup
// logic land in WEB-179; game actions in later stories. Like useRegicideGame,
// this hook will own all game state and actions and be used exactly once, by
// MicrobrewGame.

export type GamePhase = 'setup' | 'playing' | 'finished';

export type PlayerIndex = 0 | 1;

export interface PlayerState {
  name: string;
  /** Tokens in the player's Copper, one array per column (top first). */
  copper: TokenType[][];
  cash: number;
  brewers: number;
  recipeHand: Recipe[];
  loyalCustomers: Customer[];
  /** Secret reputation cards, scored at game end. */
  reputation: ReputationCard[];
}

export interface BoardState {
  /** The shared token supply (the "tin"). */
  tin: TokenType[];
  customerDeck: Customer[];
  thirstyCustomers: Customer[];
  recipeDeck: Recipe[];
  recipeBoard: Recipe[];
  reputationDeck: ReputationCard[];
  publicReputation: ReputationCard[];
}

export interface GameState {
  phase: GamePhase;
  players: [PlayerState, PlayerState];
  currentPlayer: PlayerIndex;
  board: BoardState;
}

export function useMicrobrewGame() {
  const [game] = useState<GameState | null>(null);

  const startGame = useCallback(() => {
    // Deals a new game - implemented in WEB-179.
  }, []);

  return { game, startGame };
}
