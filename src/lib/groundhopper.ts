// Groundhopper (WEB-218) - pure game logic: which stadiums are playable, the
// daily set, distance scoring, streaks and the share text. No React or browser
// APIs here so it can all be unit tested directly; the stateful side lives in
// src/hooks/useGroundhopperGame.ts. See reference/spurs-women/groundhopper/README.md.

import type { Stadium } from '@/lib/data/stadiums';

export interface GroundhopperStadium {
  id: string;
  slug: string;
  name: string;
  // Current sponsor/stadium_names name, only when it differs from `name`.
  currentName: string | null;
  city: string | null;
  country: string | null;
  capacity: number | null;
  openedYear: number | null;
  latitude: number;
  longitude: number;
  // On the Spurs Women pages (stadia.spurs_women) - every daily set includes
  // one, and only these have a stadium page to link to.
  spursWomen: boolean;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RoundResult {
  stadiumId: string;
  guess: LatLng;
  distanceKm: number;
  hintUsed: boolean;
  score: number;
}

export interface StreakState {
  lastPlayed: string | null;
  current: number;
  best: number;
}

export const ROUNDS_PER_DAY = 5;
export const MAX_ROUND_SCORE = 100;
export const HINT_SCORE_CAP = 50;
// Day 1 of Groundhopper - used only for the "#N" day number in the share text.
export const LAUNCH_DATE_KEY = '2026-10-28';

const EARTH_RADIUS_KM = 6371;
// Score decays as e^(-d / 50): ~50 points at 35 km, ~1 at 250 km.
const SCORE_DECAY_KM = 50;
// Taps this close are treated as spot on.
const PERFECT_RADIUS_KM = 1;

export function toGroundhopperStadium(
  stadium: Stadium,
  currentName: string | null
): GroundhopperStadium | null {
  const { latitude, longitude } = stadium;
  if (latitude === null || longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  // (0, 0) is an unfilled form, not a ground in the Gulf of Guinea.
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || (latitude === 0 && longitude === 0)) {
    return null;
  }

  const openedYear = stadium.opened_date ? new Date(stadium.opened_date).getUTCFullYear() : null;

  return {
    id: stadium.id,
    slug: stadium.slug,
    name: stadium.name,
    currentName: currentName && currentName !== stadium.name ? currentName : null,
    city: stadium.city,
    country: stadium.country,
    capacity: stadium.capacity,
    openedYear: openedYear !== null && Number.isFinite(openedYear) ? openedYear : null,
    latitude,
    longitude,
    spursWomen: stadium.spurs_women,
  };
}

export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function scoreForDistance(km: number, hintUsed = false): number {
  const raw = km <= PERFECT_RADIUS_KM ? MAX_ROUND_SCORE : Math.round(MAX_ROUND_SCORE * Math.exp(-km / SCORE_DECAY_KM));
  return hintUsed ? Math.min(raw, HINT_SCORE_CAP) : raw;
}

// The UK calendar date, so the daily set rolls over at UK midnight for everyone.
// Built from formatToParts rather than a locale's own date format (en-CA's
// YYYY-MM-DD has changed between ICU versions before), since everything else
// here parses this key.
export function ukDateKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function shiftDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function dayNumber(dateKey: string): number {
  const toUtc = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(dateKey) - toUtc(LAUNCH_DATE_KEY)) / 86_400_000) + 1;
}

// FNV-1a string hash -> mulberry32 PRNG: small, deterministic, and the same in
// every browser, which is all a daily puzzle seed needs.
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Sorted by id first so the result doesn't depend on the order the DB returns
// rows in. Adding a stadium does reshuffle the day's set for anyone who hasn't
// started yet - an in-progress game keeps its own stadium ids (see the hook).
//
// Every day includes one Spurs Women ground (if there are any), so the game
// stays a Spurs Women game however many other grounds are in the pool. It
// lands in a random round, not always the first.
export function dailyStadiums(
  stadiums: GroundhopperStadium[],
  dateKey: string,
  count = ROUNDS_PER_DAY
): GroundhopperStadium[] {
  if (count <= 0) {
    return [];
  }
  const pool = [...stadiums].sort((a, b) => a.id.localeCompare(b.id));
  const random = mulberry32(hashString(`groundhopper:${dateKey}`));
  const [featured] = shuffle(pool.filter(s => s.spursWomen), random);
  if (!featured) {
    return shuffle(pool, random).slice(0, count);
  }
  const others = shuffle(pool.filter(s => s.id !== featured.id), random).slice(0, Math.max(0, count - 1));
  return shuffle([featured, ...others], random);
}

export function updateStreak(previous: StreakState, dateKey: string): StreakState {
  if (previous.lastPlayed === dateKey) {
    return previous;
  }
  const current = previous.lastPlayed === shiftDateKey(dateKey, -1) ? previous.current + 1 : 1;
  return { lastPlayed: dateKey, current, best: Math.max(previous.best, current) };
}

// Streak as it should be *displayed* today: a streak whose last game was
// before yesterday has already lapsed, even though nothing has rewritten it yet.
export function activeStreak(streak: StreakState, dateKey: string): number {
  if (streak.lastPlayed === dateKey || streak.lastPlayed === shiftDateKey(dateKey, -1)) {
    return streak.current;
  }
  return 0;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km).toLocaleString('en-GB')} km`;
}

export function shareText(dateKey: string, results: RoundResult[], url: string): string {
  const total = results.reduce((sum, r) => sum + r.score, 0);
  const max = results.length * MAX_ROUND_SCORE;
  const rounds = results.map(r => `${r.score}${r.hintUsed ? '*' : ''}`).join(' · ');
  const lines = [`Groundhopper #${dayNumber(dateKey)} - ${total}/${max}`, rounds];
  if (results.some(r => r.hintUsed)) {
    lines.push('* used a hint');
  }
  lines.push(url);
  return lines.join('\n');
}
