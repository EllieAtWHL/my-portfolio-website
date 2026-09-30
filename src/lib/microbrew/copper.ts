// The Copper: layout, adjacency and the Brew puzzle's swap rules. Pure
// functions only - checked against the rulebook's Brew section and its
// worked examples (rules p.13-14).
//
// Layout: 4 columns of 4 slots, each column ordered bottom (slot 0) to top.
// Columns are staggered: columns 1 and 3 (indices 0 and 2) sit half a slot
// higher than columns 2 and 4. The optional side tank (index 4, unlocked by the
// Copper Upgrade in WEB-183) is just a 5th column, raised like 1 and 3.
//
// Slots are joined only by diagonal lines between adjacent columns. Giving each
// slot an integer height of 2 * slot (+1 in a raised column), two slots are
// neighbours exactly when their columns differ by 1 and their heights by 1 -
// so up to 4 neighbours (up/down, left/right), never same-column or horizontal.

import { MALT_DARKNESS, type TokenType } from './data';

/** A Copper slot's contents; null is an empty slot (after a Bottle, until a Mash refills it). */
export type CopperToken = TokenType | null;

/** Columns (left to right) of slots (bottom to top). 4 columns, or 5 with the side tank. */
export type Copper = CopperToken[][];

export interface CopperSlot {
  column: number;
  /** 0 = bottom of the column. */
  slot: number;
}

export const isRaisedColumn = (column: number): boolean => column % 2 === 0;

export function slotHeight({ column, slot }: CopperSlot): number {
  return 2 * slot + (isRaisedColumn(column) ? 1 : 0);
}

export const sameSlot = (a: CopperSlot, b: CopperSlot): boolean => a.column === b.column && a.slot === b.slot;

export function tokenAt(copper: Copper, { column, slot }: CopperSlot): CopperToken | undefined {
  return copper[column]?.[slot];
}

/** Diagonal neighbours of `from`: up to 4, in the adjacent columns only. */
export function getNeighbours(copper: Copper, from: CopperSlot): CopperSlot[] {
  if (tokenAt(copper, from) === undefined) return [];
  const height = slotHeight(from);
  const neighbours: CopperSlot[] = [];
  for (const column of [from.column - 1, from.column + 1]) {
    if (column < 0 || column >= copper.length) continue;
    for (const targetHeight of [height - 1, height + 1]) {
      const slot = (targetHeight - (isRaisedColumn(column) ? 1 : 0)) / 2;
      if (Number.isInteger(slot) && slot >= 0 && slot < copper[column].length) {
        neighbours.push({ column, slot });
      }
    }
  }
  return neighbours;
}

/**
 * Whether the token at `from` (the one being moved) may swap with the token at
 * `to`, judged from the moving token's point of view:
 * - neither slot may be empty, and `to` must be a diagonal neighbour;
 * - a hop can swap with anything, and anything can swap with a hop;
 * - a malt moving up must swap with a darker malt, and moving down with a
 *   lighter one (so equal shades never swap).
 */
export function isLegalSwap(copper: Copper, from: CopperSlot, to: CopperSlot): boolean {
  const moving = tokenAt(copper, from);
  const target = tokenAt(copper, to);
  if (!moving || !target) return false;
  if (!getNeighbours(copper, from).some((slot) => sameSlot(slot, to))) return false;
  if (moving === 'hops' || target === 'hops') return true;

  const movingUp = slotHeight(to) > slotHeight(from);
  return movingUp
    ? MALT_DARKNESS[target] > MALT_DARKNESS[moving]
    : MALT_DARKNESS[target] < MALT_DARKNESS[moving];
}

export function getLegalTargets(copper: Copper, from: CopperSlot): CopperSlot[] {
  return getNeighbours(copper, from).filter((to) => isLegalSwap(copper, from, to));
}

/** Swaps two slots' contents, returning a new Copper. No legality check. */
export function swapTokens(copper: Copper, a: CopperSlot, b: CopperSlot): Copper {
  const tokenA = tokenAt(copper, a) ?? null;
  const tokenB = tokenAt(copper, b) ?? null;
  return copper.map((column, c) =>
    column.map((token, s) => {
      if (c === a.column && s === a.slot) return tokenB;
      if (c === b.column && s === b.slot) return tokenA;
      return token;
    }),
  );
}
