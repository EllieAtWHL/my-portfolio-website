// Generic deck helpers for Microbrew's customer, recipe, reputation and token
// piles. Pure functions - they never mutate their input.

/**
 * Fisher-Yates shuffle, matching the old prototype: iterate from the end,
 * swapping each index with a random index at or below it.
 */
export function shuffle<T>(array: readonly T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Takes `count` items off the front (top) of `deck`. Throws rather than
 * silently dealing short, since every setup deal in Microbrew has a fixed size.
 */
export function deal<T>(deck: readonly T[], count: number): { dealt: T[]; remaining: T[] } {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`Cannot deal ${count} cards`);
  }
  if (count > deck.length) {
    throw new RangeError(`Cannot deal ${count} cards from a deck of ${deck.length}`);
  }
  return { dealt: deck.slice(0, count), remaining: deck.slice(count) };
}
