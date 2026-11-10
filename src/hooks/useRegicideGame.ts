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
  maxAttack: number;
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
  // True once at least one card has been discarded towards the current
  // defence - closes the solo Jester window (see isJesterTiming)
  hasDiscarded: boolean;
  message: GameMessage | null;
  gameOver: boolean;
  victory: boolean;
}

// Solo-play victory grading from the rulebook: a win using no Jesters is
// Gold, one is Silver, both is Bronze.
export type VictoryMedal = 'gold' | 'silver' | 'bronze';

export interface GameStats {
  gamesStarted: number;
  gamesWon: number;
  gamesLost: number;
  goldWins: number;
  silverWins: number;
  bronzeWins: number;
  lastPlayed: string;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
// Exported (along with SET_LIMITS and ROYAL_STATS) so the in-app rules
// reference (RulesModal) shows the numbers the engine actually plays by,
// rather than a hand-typed copy that could drift from them.
export const HAND_LIMIT = 8;
export const TOTAL_JESTERS = 2;
// Same-rank combos: how many cards of that rank may be chosen together
// (their values must sum to 10 or less - 4x2, 3x3, 2x4 or 2x5).
export const SET_LIMITS: Partial<Record<Rank, number>> = { '2': 4, '3': 3, '4': 2, '5': 2 };

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

// Display-only ordering for the optional "sort hand" view - matches the
// original vanilla-JS implementation's Deck.sort() (myPortfolioWebsite/regicide/deck.js),
// not the SUITS order above (which only affects how the full deck is built,
// so its order is irrelevant post-shuffle).
const HAND_SORT_SUIT_ORDER: Record<Suit, number> = { spades: 0, hearts: 1, clubs: 2, diamonds: 3 };
const HAND_SORT_RANK_ORDER: Record<Rank, number> = Object.fromEntries(RANKS.map((rank, index) => [rank, index])) as Record<Rank, number>;

export function compareHandCards(a: PlayingCard, b: PlayingCard): number {
  return (
    HAND_SORT_SUIT_ORDER[a.suit] - HAND_SORT_SUIT_ORDER[b.suit] ||
    HAND_SORT_RANK_ORDER[a.rank] - HAND_SORT_RANK_ORDER[b.rank]
  );
}

export const ROYAL_STATS: Record<'J' | 'Q' | 'K', { attack: number; health: number }> = {
  J: { attack: 10, health: 20 },
  Q: { attack: 15, health: 30 },
  K: { attack: 20, health: 40 },
};

export const DEFAULT_STATS: GameStats = {
  gamesStarted: 0,
  gamesWon: 0,
  gamesLost: 0,
  goldWins: 0,
  silverWins: 0,
  bronzeWins: 0,
  lastPlayed: 'Never',
};

const STATS_KEY = 'regicide-stats';

// Merged over DEFAULT_STATS so stats saved before a field existed (e.g. the
// per-medal win counts, added in WEB-78) still load with that field at 0.
// Shared by the hook and StatsScreen so there's one reader of this key.
// Only known fields are kept, so obsolete ones (like the `winRate` the old
// StatsScreen reset used to write) aren't carried forward on every save,
// and unreadable saved data falls back to the defaults rather than
// throwing during render.
export function loadStats(): GameStats {
  if (typeof window === 'undefined') return { ...DEFAULT_STATS };
  let saved: Partial<GameStats> = {};
  try {
    saved = JSON.parse(localStorage.getItem(STATS_KEY) ?? '{}') ?? {};
  } catch {
    return { ...DEFAULT_STATS };
  }
  const stats = { ...DEFAULT_STATS };
  for (const key of Object.keys(DEFAULT_STATS) as (keyof GameStats)[]) {
    if (typeof saved[key] === typeof DEFAULT_STATS[key]) {
      (stats as Record<keyof GameStats, unknown>)[key] = saved[key];
    }
  }
  return stats;
}

export function saveStats(stats: GameStats) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }
}

export function victoryMedal(jestersRemaining: number): VictoryMedal {
  const jestersUsed = TOTAL_JESTERS - jestersRemaining;
  if (jestersUsed <= 0) return 'gold';
  if (jestersUsed === 1) return 'silver';
  return 'bronze';
}

const MEDAL_STAT: Record<VictoryMedal, 'goldWins' | 'silverWins' | 'bronzeWins'> = {
  gold: 'goldWins',
  silver: 'silverWins',
  bronze: 'bronzeWins',
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
  hasDiscarded: false,
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

// The actual damage a set of chosen cards would deal against a given royal -
// clubs double the total, but only when the royal isn't itself a clubs
// royal (a clubs card matching the royal's own suit doesn't trigger its
// power, same as every other suit). Shared so the attack phase's live
// "Attack Power" preview can show exactly what attack() below is about to
// compute, rather than a second copy of this rule that could drift from it.
export function calculateAttackDamage(chosenCards: PlayingCard[], royalSuit: Suit): number {
  const attackTotal = chosenCards.reduce((sum, card) => sum + cardValue(card.rank), 0);
  const hasActiveClubs = chosenCards.some((card) => card.suit === 'clubs' && card.suit !== royalSuit);
  return hasActiveClubs ? attackTotal * 2 : attackTotal;
}

function toRoyal(card: PlayingCard): RoyalCard {
  const stats = ROYAL_STATS[card.rank as 'J' | 'Q' | 'K'];
  return { ...card, attack: stats.attack, maxAttack: stats.attack, health: stats.health, maxHealth: stats.health };
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

// A combo is: a single card; an Ace (Animal Companion) paired with exactly
// one other card - which may itself be another Ace - in either order; or a
// same-rank set of 2s/3s/4s/5s up to SET_LIMITS[rank]. An Ace can never
// join a same-rank set.
export function isValidSelection(chosenCards: PlayingCard[], candidate: PlayingCard): boolean {
  if (chosenCards.length === 0) return true;

  if (chosenCards.length === 1) {
    const [only] = chosenCards;
    if (only.rank === 'A' || candidate.rank === 'A') return true;
  }

  if (candidate.rank === 'A') return false;
  const limit = SET_LIMITS[candidate.rank];
  if (!limit) return false;
  const allSameRank = chosenCards.every((c) => c.rank === candidate.rank);
  return allSameRank && chosenCards.length < limit;
}

// Solo Jester timing: only at the start of Step 1 (before any card is
// chosen) or the start of Step 4 (before any damage has been discarded).
// Without this, a Jester could be flipped with cards already chosen -
// keeping them in play while also dealing a fresh hand.
export function isJesterTiming(data: GameData): boolean {
  if (data.chosenCards.length > 0) return false;
  return !(data.phase === 'defend' && data.hasDiscarded);
}

function handValue(hand: PlayingCard[]): number {
  return hand.reduce((sum, card) => sum + cardValue(card.rank), 0);
}

function lose(data: GameData, reason: string): GameData {
  return {
    ...data,
    gameOver: true,
    victory: false,
    isPlaying: false,
    message: { text: `Sorry, you lost - ${reason}`, tone: 'error' },
  };
}

// Run after every action that changes the hand: out of cards and jesters
// means nothing is left to play. A hand that can't cover a royal's attack
// isn't a loss on its own here - the player discards until the hand is
// empty, which keeps Undo available until the very last card (see the
// defend branch of selectHandCard for the one case that's refused instead).
export function checkForLoss(data: GameData): GameData {
  if (data.gameOver) return data;
  if (data.playerHand.length === 0 && data.jestersRemaining === 0) {
    return lose(data, 'out of cards and jesters');
  }
  return data;
}

export function useRegicideGame() {
  const [isLoading, setIsLoading] = useState(true);
  const [gameData, setGameData] = useState<GameData>(EMPTY_GAME_DATA);
  const [history, setHistory] = useState<GameData[]>([]);

  const winGame = useCallback((medal: VictoryMedal) => {
    const stats = loadStats();
    stats.gamesWon += 1;
    stats[MEDAL_STAT[medal]] += 1;
    saveStats(stats);
  }, []);

  const loseGame = useCallback(() => {
    const stats = loadStats();
    stats.gamesLost += 1;
    saveStats(stats);
  }, []);

  const recordGameStarted = useCallback(() => {
    const stats = loadStats();
    stats.gamesStarted += 1;
    stats.lastPlayed = new Date().toISOString();
    saveStats(stats);
  }, []);

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
      hasDiscarded: false,
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
      // If the hand can't cover the damage but a Jester still could (only
      // before the first discard), refuse the discard: once discarding
      // starts the Jester window closes, and the player would be left
      // discarding towards a certain loss with no way back.
      if (isJesterTiming(prev) && prev.jestersRemaining > 0 && handValue(prev.playerHand) < prev.defenceRemaining) {
        setGameData({
          ...prev,
          message: {
            text: `Your hand can't cover ${prev.defenceRemaining} damage - use a Jester first`,
            tone: 'error',
          },
        });
        return;
      }

      const remainingHand = removeCard(prev.playerHand, card);
      const remainingDefence = Math.max(0, prev.defenceRemaining - cardValue(card.rank));
      let next: GameData = {
        ...prev,
        playerHand: remainingHand,
        discardPile: [card, ...prev.discardPile],
        defenceRemaining: remainingDefence,
        hasDiscarded: remainingDefence > 0,
        phase: remainingDefence <= 0 ? 'attack' : 'defend',
        message:
          remainingDefence <= 0
            ? null
            : { text: `Current defence needed is ${remainingDefence}`, tone: 'info' },
      };
      next = checkForLoss(next);

      // A discard can only ever end the game as a loss (out of cards and
      // jesters) - victory only comes from attack() defeating the last royal.
      if (next.gameOver && !prev.gameOver) {
        loseGame();
      }

      setHistory((h) => [prev, ...h]);
      setGameData(next);
    },
    [gameData, loseGame]
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

    const damage = calculateAttackDamage(chosenCards, royal.suit);
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
        hasDiscarded: false,
        message: { text: messages.join(' · '), tone: 'info' },
      };
      next = checkForLoss(next);

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
      hasDiscarded: false,
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
      next = checkForLoss(next);
    }

    if (next.gameOver && !prev.gameOver) {
      if (next.victory) winGame(victoryMedal(next.jestersRemaining));
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

    if (!isJesterTiming(prev)) {
      setGameData({
        ...prev,
        message: {
          text: 'A Jester can only be used before you choose a card, or before you start discarding',
          tone: 'error',
        },
      });
      return;
    }

    const discardPile = [...prev.playerHand, ...prev.discardPile];
    const playerHand = prev.tavernDeck.slice(0, HAND_LIMIT);
    const tavernDeck = prev.tavernDeck.slice(HAND_LIMIT);

    // If the tavern deck is also empty, this can deal an empty hand - with
    // no cards and (once jestersRemaining hits 0 below) no jesters left
    // either, that's a loss, not a silent soft-lock.
    let next: GameData = {
      ...prev,
      playerHand,
      tavernDeck,
      discardPile,
      jestersRemaining: prev.jestersRemaining - 1,
      message: null,
    };
    next = checkForLoss(next);

    if (next.gameOver && !prev.gameOver) {
      loseGame();
    }

    setHistory((h) => [prev, ...h]);
    setGameData(next);
  }, [gameData, loseGame]);

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
