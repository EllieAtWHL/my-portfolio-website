'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  activeStreak,
  dailyStadiums,
  distanceKm,
  scoreForDistance,
  ukDateKey,
  updateStreak,
  type GroundhopperStadium,
  type LatLng,
  type RoundResult,
  type StreakState,
} from '@/lib/groundhopper';

const GAME_KEY = 'groundhopper:v1:game';
const STREAK_KEY = 'groundhopper:v1:streak';

interface SavedGame {
  dateKey: string;
  stadiumIds: string[];
  results: RoundResult[];
  // Saved as soon as the hint is shown, so reloading can't un-see the city
  // and lift the round's 50-point cap.
  hintForRound?: number;
}

const EMPTY_STREAK: StreakState = { lastPlayed: null, current: 0, best: 0 };

// localStorage can be missing or throw (private windows, blocked site data) -
// the game still plays, it just won't remember today's result or the streak.
function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best effort only.
  }
}

interface InitialState {
  dateKey: string;
  rounds: GroundhopperStadium[];
  results: RoundResult[];
  hintUsed: boolean;
}

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

// Anything read back from storage is checked rather than trusted - a corrupt
// or older-shaped entry just means starting today (or the streak) afresh.
function isRoundResult(value: unknown): value is RoundResult {
  const r = value as RoundResult | null;
  return (
    typeof r === 'object' && r !== null &&
    typeof r.stadiumId === 'string' &&
    isFiniteNumber(r.guess?.latitude) && isFiniteNumber(r.guess?.longitude) &&
    isFiniteNumber(r.distanceKm) && isFiniteNumber(r.score) &&
    typeof r.hintUsed === 'boolean'
  );
}

function readStreak(): StreakState {
  const saved = readJson<StreakState>(STREAK_KEY);
  if (
    saved && (saved.lastPlayed === null || typeof saved.lastPlayed === 'string') &&
    isFiniteNumber(saved.current) && isFiniteNumber(saved.best)
  ) {
    return saved;
  }
  return EMPTY_STREAK;
}

// A game already started today keeps its own stadiums, even if a stadium has
// since been added (which would reshuffle dailyStadiums) - unless one of them
// has been removed or lost its coordinates, in which case today starts over.
function loadInitialState(stadiums: GroundhopperStadium[]): InitialState {
  const dateKey = ukDateKey();
  const saved = readJson<SavedGame>(GAME_KEY);
  if (
    saved?.dateKey === dateKey && Array.isArray(saved.stadiumIds) &&
    Array.isArray(saved.results) && saved.results.every(isRoundResult)
  ) {
    const byId = new Map(stadiums.map(s => [s.id, s]));
    const rounds = saved.stadiumIds.map(id => byId.get(id));
    if (rounds.length > 0 && rounds.every(Boolean) && saved.results.length <= rounds.length) {
      return {
        dateKey,
        rounds: rounds as GroundhopperStadium[],
        results: saved.results,
        hintUsed: saved.hintForRound === saved.results.length,
      };
    }
  }
  return { dateKey, rounds: dailyStadiums(stadiums, dateKey), results: [], hintUsed: false };
}

export type GroundhopperPhase = 'guessing' | 'revealed' | 'finished';

// Only ever rendered client-side (GroundhopperLoader loads it with ssr: false),
// so the lazy initialisers can read the date and localStorage directly.
export function useGroundhopperGame(stadiums: GroundhopperStadium[]) {
  const [initial] = useState(() => loadInitialState(stadiums));
  const { dateKey, rounds } = initial;
  const [results, setResults] = useState<RoundResult[]>(initial.results);
  const [revealed, setRevealed] = useState(false);
  const [pendingGuess, setPendingGuess] = useState<LatLng | null>(null);
  const [hintUsed, setHintUsed] = useState(initial.hintUsed);
  const [streak, setStreak] = useState<StreakState>(readStreak);

  // A tab left open past UK midnight would otherwise keep showing (and
  // sharing) yesterday's set - reload into today's when the player comes back.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && ukDateKey() !== dateKey) {
        window.location.reload();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [dateKey]);

  const finished = !revealed && rounds.length > 0 && results.length === rounds.length;
  const phase: GroundhopperPhase = finished ? 'finished' : revealed ? 'revealed' : 'guessing';
  const roundIndex = revealed ? results.length - 1 : Math.min(results.length, rounds.length - 1);
  const currentStadium = rounds[roundIndex] ?? null;
  const currentResult = revealed ? results[results.length - 1] : null;

  const placeGuess = useCallback(
    (guess: LatLng) => {
      if (phase === 'guessing') {
        setPendingGuess(guess);
      }
    },
    [phase]
  );

  const revealHint = useCallback(() => {
    if (phase === 'guessing') {
      setHintUsed(true);
      writeJson(GAME_KEY, {
        dateKey,
        stadiumIds: rounds.map(s => s.id),
        results,
        hintForRound: results.length,
      } satisfies SavedGame);
    }
  }, [phase, dateKey, rounds, results]);

  const submitGuess = useCallback(() => {
    if (phase !== 'guessing' || !pendingGuess || !currentStadium) {
      return;
    }
    const km = distanceKm(pendingGuess, currentStadium);
    const result: RoundResult = {
      stadiumId: currentStadium.id,
      guess: pendingGuess,
      distanceKm: km,
      hintUsed,
      score: scoreForDistance(km, hintUsed),
    };
    const nextResults = [...results, result];
    setResults(nextResults);
    setRevealed(true);
    writeJson(GAME_KEY, { dateKey, stadiumIds: rounds.map(s => s.id), results: nextResults } satisfies SavedGame);

    if (nextResults.length === rounds.length) {
      const nextStreak = updateStreak(streak, dateKey);
      setStreak(nextStreak);
      writeJson(STREAK_KEY, nextStreak);
    }
  }, [phase, pendingGuess, currentStadium, hintUsed, results, rounds, dateKey, streak]);

  const nextRound = useCallback(() => {
    if (phase !== 'revealed') {
      return;
    }
    setRevealed(false);
    setPendingGuess(null);
    setHintUsed(false);
  }, [phase]);

  return {
    dateKey,
    rounds,
    results,
    phase,
    roundIndex,
    currentStadium,
    currentResult,
    pendingGuess,
    hintUsed,
    totalScore: results.reduce((sum, r) => sum + r.score, 0),
    streak: activeStreak(streak, dateKey),
    bestStreak: streak.best,
    placeGuess,
    revealHint,
    submitGuess,
    nextRound,
  };
}
