'use client';

import { useCallback, useState } from 'react';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface PlayingCard {
  suit: Suit;
  rank: Rank;
}

export interface RoyalCard extends PlayingCard {
  attack: number;
  health: number;
  maxHealth: number;
}

export type GamePhase = 'attack' | 'defend';

export interface GameMessage {
  text: string;
  tone: 'info' | 'error';
}

export interface GameData {
  isPlaying: boolean;
  phase: GamePhase;
  royalCard: RoyalCard | null;
  royalDeck: RoyalCard[];
  tavernDeck: PlayingCard[];
  playerHand: PlayingCard[];
  chosenCards: PlayingCard[];
  activeDeck: PlayingCard[];
  discardPile: PlayingCard[];
  jestersRemaining: number;
  defenceRemaining: number;
  message: GameMessage | null;
  gameOver: boolean;
  victory: boolean;
}

interface GameStats {
  gamesStarted: number;
  gamesWon: number;
  gamesLost: number;
  lastPlayed: string;
  totalPlayTime: number;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const HAND_LIMIT = 8;
const TOTAL_JESTERS = 2;
// Same-rank combos: how many cards of that rank may be chosen together
// (their values must sum to 10 or less - 4x2, 3x3 or 2x4).
const SET_LIMITS: Partial<Record<Rank, number>> = { '2': 4, '3': 3, '4': 2 };

export const SUIT_SYMBOL: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  clubs: '♣',
  diamonds: '♦',
};

export const SUIT_POWER_LABEL: Record<Suit, string> = {
  spades: 'Shield against enemy attack',
  hearts: 'Heal from the discard',
  clubs: 'Double damage',
  diamonds: 'Draw cards',
};

const ROYAL_STATS: Record<'J' | 'Q' | 'K', { attack: number; health: number }> = {
  J: { attack: 10, health: 20 },
  Q: { attack: 15, health: 30 },
  K: { attack: 20, health: 40 },
};

const DEFAULT_STATS: GameStats = {
  gamesStarted: 0,
  gamesWon: 0,
  gamesLost: 0,
  lastPlayed: 'Never',
  totalPlayTime: 0,
};

const EMPTY_GAME_DATA: GameData = {
  isPlaying: false,
  phase: 'attack',
  royalCard: null,
  royalDeck: [],
  tavernDeck: [],
  playerHand: [],
  chosenCards: [],
  activeDeck: [],
  discardPile: [],
  jestersRemaining: TOTAL_JESTERS,
  defenceRemaining: 0,
  message: null,
  gameOver: false,
  victory: false,
};

export function cardValue(rank: Rank): number {
  if (rank === 'A') return 1;
  if (rank === 'J') return 10;
  if (rank === 'Q') return 15;
  if (rank === 'K') return 20;
  return parseInt(rank, 10);
}

function toRoyal(card: PlayingCard): RoyalCard {
  const stats = ROYAL_STATS[card.rank as 'J' | 'Q' | 'K'];
  return { ...card, attack: stats.attack, health: stats.health, maxHealth: stats.health };
}

function stripToPlainCard(card: PlayingCard): PlayingCard {
  return { suit: card.suit, rank: card.rank };
}

function cardsEqual(a: PlayingCard, b: PlayingCard): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

function removeCard(cards: PlayingCard[], card: PlayingCard): PlayingCard[] {
  const index = cards.findIndex((c) => cardsEqual(c, card));
  if (index === -1) return cards;
  return [...cards.slice(0, index), ...cards.slice(index + 1)];
}

function shuffle<T>(deck: T[]): T[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildStandardDeck() {
  const tavern: PlayingCard[] = [];
  const jacks: PlayingCard[] = [];
  const queens: PlayingCard[] = [];
  const kings: PlayingCard[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const card: PlayingCard = { suit, rank };
      if (rank === 'J') jacks.push(card);
      else if (rank === 'Q') queens.push(card);
      else if (rank === 'K') kings.push(card);
      else tavern.push(card);
    }
  }

  return { tavern, jacks, queens, kings };
}

// A combo is: a single card; a single non-Ace card paired with a single Ace
// (in either order, as its "companion"); or a same-rank set of 2s/3s/4s up
// to SET_LIMITS[rank].
export function isValidSelection(chosenCards: PlayingCard[], candidate: PlayingCard): boolean {
  if (chosenCards.length === 0) return true;

  if (chosenCards.length === 1) {
    const [only] = chosenCards;
    const exactlyOneIsAce = (only.rank === 'A') !== (candidate.rank === 'A');
    if (exactlyOneIsAce) return true;
  }

  if (candidate.rank === 'A') return false;
  const limit = SET_LIMITS[candidate.rank];
  if (!limit) return false;
  const allSameRank = chosenCards.every((c) => c.rank === candidate.rank);
  return allSameRank && chosenCards.length < limit;
}

function checkHandExhausted(data: GameData): GameData {
  if (data.gameOver) return data;
  if (data.playerHand.length === 0 && data.jestersRemaining === 0) {
    return {
      ...data,
      gameOver: true,
      victory: false,
      isPlaying: false,
      message: { text: 'Sorry, you lost - out of cards and jesters', tone: 'error' },
    };
  }
  return data;
}

export function useRegicideGame() {
  const [isLoading, setIsLoading] = useState(true);
  const [gameData, setGameData] = useState<GameData>(EMPTY_GAME_DATA);
  const [history, setHistory] = useState<GameData[]>([]);

  const loadStats = useCallback((): GameStats => {
    if (typeof window === 'undefined') return { ...DEFAULT_STATS };
    const saved = localStorage.getItem('regicide-stats');
    return saved ? JSON.parse(saved) : { ...DEFAULT_STATS };
  }, []);

  const saveStats = useCallback((stats: GameStats) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('regicide-stats', JSON.stringify(stats));
    }
  }, []);

  const winGame = useCallback(() => {
    const stats = loadStats();
    stats.gamesWon += 1;
    saveStats(stats);
  }, [loadStats, saveStats]);

  const loseGame = useCallback(() => {
    const stats = loadStats();
    stats.gamesLost += 1;
    saveStats(stats);
  }, [loadStats, saveStats]);

  const recordGameStarted = useCallback(() => {
    const stats = loadStats();
    stats.gamesStarted += 1;
    stats.lastPlayed = new Date().toISOString();
    saveStats(stats);
  }, [loadStats, saveStats]);

  const initializeGame = useCallback(() => {
    setIsLoading(true);
    setHistory([]);
    setGameData(EMPTY_GAME_DATA);
    setIsLoading(false);
  }, []);

  const startGame = useCallback(() => {
    const { tavern, jacks, queens, kings } = buildStandardDeck();
    const royalDeck = [...shuffle(jacks), ...shuffle(queens), ...shuffle(kings)].map(toRoyal);
    const tavernDeck = shuffle(tavern);
    const playerHand = tavernDeck.splice(0, HAND_LIMIT);
    const [royalCard, ...remainingRoyalDeck] = royalDeck;

    recordGameStarted();
    setHistory([]);
    setGameData({
      isPlaying: true,
      phase: 'attack',
      royalCard,
      royalDeck: remainingRoyalDeck,
      tavernDeck,
      playerHand,
      chosenCards: [],
      activeDeck: [],
      discardPile: [],
      jestersRemaining: TOTAL_JESTERS,
      defenceRemaining: 0,
      message: null,
      gameOver: false,
      victory: false,
    });
  }, [recordGameStarted]);

  const selectHandCard = useCallback(
    (index: number) => {
      const prev = gameData;
      if (!prev.isPlaying || prev.gameOver) return;
      const card = prev.playerHand[index];
      if (!card) return;

      if (prev.phase === 'attack') {
        if (!isValidSelection(prev.chosenCards, card)) {
          setGameData({ ...prev, message: { text: 'Illegal move', tone: 'error' } });
          return;
        }

        setHistory((h) => [prev, ...h]);
        setGameData({
          ...prev,
          playerHand: removeCard(prev.playerHand, card),
          chosenCards: [...prev.chosenCards, card],
          message: null,
        });
        return;
      }

      // Defend phase: discard cards to cover the royal's attack.
      const remainingHand = removeCard(prev.playerHand, card);
      const remainingDefence = Math.max(0, prev.defenceRemaining - cardValue(card.rank));
      let next: GameData = {
        ...prev,
        playerHand: remainingHand,
        discardPile: [card, ...prev.discardPile],
        defenceRemaining: remainingDefence,
        phase: remainingDefence <= 0 ? 'attack' : 'defend',
        message:
          remainingDefence <= 0
            ? null
            : { text: `Current defence needed is ${remainingDefence}`, tone: 'info' },
      };
      next = checkHandExhausted({ ...next, playerHand: remainingHand });

      if (next.gameOver && !prev.gameOver) {
        if (next.victory) winGame();
        else loseGame();
      }

      setHistory((h) => [prev, ...h]);
      setGameData(next);
    },
    [gameData, winGame, loseGame]
  );

  const attack = useCallback(() => {
    const prev = gameData;
    if (
      !prev.isPlaying ||
      prev.gameOver ||
      prev.phase !== 'attack' ||
      prev.chosenCards.length === 0 ||
      !prev.royalCard
    ) {
      return;
    }

    const royal = prev.royalCard;
    const chosenCards = prev.chosenCards;
    const activeSuits = new Set(
      chosenCards.filter((c) => c.suit !== royal.suit).map((c) => c.suit)
    );
    const isBlocked = chosenCards.some((c) => c.suit === royal.suit);

    let tavernDeck = prev.tavernDeck;
    let discardPile = prev.discardPile;
    let playerHand = prev.playerHand;
    const messages: string[] = [];

    if (isBlocked) {
      messages.push(`${SUIT_SYMBOL[royal.suit]} power is blocked`);
    }

    const attackTotal = chosenCards.reduce((sum, c) => sum + cardValue(c.rank), 0);

    if (activeSuits.has('hearts')) {
      const maxHeal = Math.min(attackTotal, discardPile.length);
      if (maxHeal > 0) {
        const shuffledDiscard = shuffle(discardPile);
        tavernDeck = [...tavernDeck, ...shuffledDiscard.slice(0, maxHeal)];
        discardPile = shuffledDiscard.slice(maxHeal);
        messages.push(`Healing ${maxHeal} ${maxHeal === 1 ? 'card' : 'cards'} from the discard pile`);
      } else {
        messages.push('Unable to heal from discard');
      }
    }

    if (activeSuits.has('diamonds')) {
      const maxDraw = Math.min(attackTotal, HAND_LIMIT - playerHand.length, tavernDeck.length);
      if (maxDraw > 0) {
        playerHand = [...playerHand, ...tavernDeck.slice(0, maxDraw)];
        tavernDeck = tavernDeck.slice(maxDraw);
        messages.push(`Drawing ${maxDraw} ${maxDraw === 1 ? 'card' : 'cards'} from tavern`);
      }
    }

    const damage = activeSuits.has('clubs') ? attackTotal * 2 : attackTotal;
    const newHealth = royal.health - damage;
    messages.push(`Attacking ${royal.rank} of ${royal.suit} for ${damage} damage`);

    if (newHealth > 0) {
      let royalAttack = royal.attack;
      if (activeSuits.has('spades')) {
        royalAttack = Math.max(0, royalAttack - attackTotal);
      }

      const nextRoyal: RoyalCard = { ...royal, health: newHealth, attack: royalAttack };
      const phase: GamePhase = royalAttack > 0 ? 'defend' : 'attack';
      if (royalAttack > 0) {
        messages.push(`${royal.rank} of ${royal.suit} is attacking for ${royalAttack}`);
      }

      let next: GameData = {
        ...prev,
        royalCard: nextRoyal,
        tavernDeck,
        discardPile,
        playerHand,
        chosenCards: [],
        activeDeck: [...prev.activeDeck, ...chosenCards],
        phase,
        defenceRemaining: royalAttack > 0 ? royalAttack : 0,
        message: { text: messages.join(' · '), tone: 'info' },
      };
      next = checkHandExhausted(next);

      if (next.gameOver && !prev.gameOver) {
        loseGame();
      }

      setHistory((h) => [prev, ...h]);
      setGameData(next);
      return;
    }

    // Royal defeated.
    const exactKill = newHealth === 0;
    const plainRoyal = stripToPlainCard(royal);
    let newTavern = tavernDeck;
    let newDiscard = [...chosenCards, ...prev.activeDeck, ...discardPile];

    if (exactKill) {
      newTavern = [plainRoyal, ...newTavern];
      messages.push(`${royal.rank} of ${royal.suit} defeated with a critical hit`);
    } else {
      newDiscard = [plainRoyal, ...newDiscard];
      messages.push(`${royal.rank} of ${royal.suit} defeated`);
    }

    const nextRoyalCard = prev.royalDeck[0] ?? null;
    const nextRoyalDeck = prev.royalDeck.slice(1);

    let next: GameData = {
      ...prev,
      royalCard: nextRoyalCard,
      royalDeck: nextRoyalDeck,
      tavernDeck: newTavern,
      discardPile: newDiscard,
      playerHand,
      chosenCards: [],
      activeDeck: [],
      phase: 'attack',
      defenceRemaining: 0,
      message: { text: messages.join(' · '), tone: 'info' },
    };

    if (!nextRoyalCard) {
      next = {
        ...next,
        gameOver: true,
        victory: true,
        isPlaying: false,
        message: { text: 'You won the game!', tone: 'info' },
      };
    } else {
      next = checkHandExhausted(next);
    }

    if (next.gameOver && !prev.gameOver) {
      if (next.victory) winGame();
      else loseGame();
    }

    setHistory((h) => [prev, ...h]);
    setGameData(next);
  }, [gameData, winGame, loseGame]);

  const useJester = useCallback(() => {
    const prev = gameData;
    if (!prev.isPlaying || prev.gameOver) return;

    if (prev.jestersRemaining < 1) {
      setGameData({ ...prev, message: { text: 'No jesters remaining', tone: 'error' } });
      return;
    }

    const discardPile = [...prev.playerHand, ...prev.discardPile];
    const playerHand = prev.tavernDeck.slice(0, HAND_LIMIT);
    const tavernDeck = prev.tavernDeck.slice(HAND_LIMIT);

    setHistory((h) => [prev, ...h]);
    setGameData({
      ...prev,
      playerHand,
      tavernDeck,
      discardPile,
      jestersRemaining: prev.jestersRemaining - 1,
      message: null,
    });
  }, [gameData]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const [last, ...rest] = history;
    setHistory(rest);
    setGameData(last);
  }, [history]);

  return {
    isLoading,
    gameData,
    canUndo: history.length > 0,
    initializeGame,
    startGame,
    selectHandCard,
    attack,
    useJester,
    undo,
    loadStats,
    saveStats,
    winGame,
    loseGame,
  };
}
