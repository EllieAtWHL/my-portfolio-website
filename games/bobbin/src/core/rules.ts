// Board/belt geometry and the single source of truth for one belt tick.
//
// The prototype had this logic twice - once in the game loop, once in the
// simulated players - and the copies drifted (the auto-finish count). Here a
// tick is split into two shared halves, `advance` then `feed`, and both the
// game and the simulator call them:
//
//   game:      advance -> feed               (taps queue into `pending` between ticks)
//   simulator: advance -> player decides -> feed
//
// The simulator's decision slots in between so a chosen bobbin enters on the
// same tick it was chosen, exactly as in the prototype's calibrated simulator.

import type { Colour } from "./palette.ts";

export type Cell = Colour | null;
export type Grid = Cell[][];

export interface Bobbin {
  c: Colour;
  /** Capacity left: stitches it can still collect. */
  n: number;
}

export interface BeltBobbin extends Bobbin {
  /** Belt position: -1 is the entry corner, 0..L-1 the belt, L the exit. */
  i: number;
  /** Position on the previous tick, for render interpolation. */
  prev: number;
}

export type Status = "play" | "won" | "lost";

export interface PlayState {
  grid: Grid;
  W: number;
  H: number;
  L: number;
  cols: BeltBobbin[][];
  rack: BeltBobbin[];
  belt: BeltBobbin[];
  /** Sent by the player, waiting for the entry corner to clear. */
  pending: BeltBobbin[];
  rackSize: number;
  beltMax: number;
  /** Stitches still on the board. */
  left: number;
  status: Status;
}

export type TickEvent =
  | { type: "collect"; x: number; y: number; bobbin: BeltBobbin }
  | { type: "empty"; bobbin: BeltBobbin }
  | { type: "rack"; bobbin: BeltBobbin }
  | { type: "enter"; bobbin: BeltBobbin }
  | { type: "won" }
  | { type: "lost"; bobbin: BeltBobbin };

// ---------- geometry ----------

// The belt starts at the bottom-left and runs clockwise: up the left side,
// across the top, down the right side, then back along the bottom.
export function beltLength(grid: Grid): number {
  return 2 * grid.length + 2 * grid[0].length;
}

/** The first stitch a bobbin at belt position i can see, or null. */
export function lineFirst(grid: Grid, i: number): [number, number] | null {
  const H = grid.length;
  const W = grid[0].length;
  if (i < H) {
    const y = H - 1 - i;
    for (let x = 0; x < W; x++) if (grid[y][x]) return [x, y];
  } else if (i < H + W) {
    const x = i - H;
    for (let y = 0; y < H; y++) if (grid[y][x]) return [x, y];
  } else if (i < 2 * H + W) {
    const y = i - H - W;
    for (let x = W - 1; x >= 0; x--) if (grid[y][x]) return [x, y];
  } else {
    const x = W - 1 - (i - 2 * H - W);
    for (let y = H - 1; y >= 0; y--) if (grid[y][x]) return [x, y];
  }
  return null;
}

/** Every stitch visible from some belt position, in belt order (no repeats). */
export function exposed(grid: Grid): [number, number][] {
  const L = beltLength(grid);
  const seen = new Map<string, [number, number]>();
  for (let i = 0; i < L; i++) {
    const p = lineFirst(grid, i);
    if (p) seen.set(p[0] + "," + p[1], p);
  }
  return [...seen.values()];
}

// ---------- state ----------

export function toBeltBobbin(b: Bobbin): BeltBobbin {
  return { c: b.c, n: b.n, i: -1, prev: -1 };
}

export function createPlayState(
  grid: Grid,
  cols: Bobbin[][],
  rackSize: number,
  beltMax: number,
): PlayState {
  const g = grid.map((row) => row.slice());
  return {
    grid: g,
    W: g[0].length,
    H: g.length,
    L: beltLength(g),
    cols: cols.map((col) => col.map(toBeltBobbin)),
    rack: [],
    belt: [],
    pending: [],
    rackSize,
    beltMax,
    left: g.flat().filter(Boolean).length,
    status: "play",
  };
}

export function supplyCount(s: PlayState): number {
  return s.cols.reduce((sum, col) => sum + col.length, 0);
}

/**
 * Once every bobbin still in play would fit on the rack, losing is
 * impossible, so the game locks input and feeds everything in. The count
 * must include bobbins already on the belt - leaving them out was the
 * prototype's playtest bug. Bobbins only ever leave play, so once this is
 * true it stays true.
 */
export function isAutoFinishing(s: PlayState): boolean {
  return supplyCount(s) + s.rack.length + s.pending.length + s.belt.length <= s.rackSize;
}

/** A bobbin can enter: the belt has room and nothing is within 1 of the start. */
export function entryOpen(s: PlayState): boolean {
  return s.belt.length < s.beltMax && !s.belt.some((b) => b.i < 1);
}

/** Whether the player may send another bobbin right now. */
export function canSend(s: PlayState): boolean {
  return s.status === "play" && !isAutoFinishing(s) && s.belt.length + s.pending.length < s.beltMax;
}

/** Player sends the front bobbin of supply column k. */
export function sendFromColumn(s: PlayState, k: number): boolean {
  if (!canSend(s) || !s.cols[k]?.length) return false;
  s.pending.push(s.cols[k].shift()!);
  return true;
}

/** Player sends rack slot k. */
export function sendFromRack(s: PlayState, k: number): boolean {
  if (!canSend(s) || !s.rack[k]) return false;
  s.pending.push(s.rack.splice(k, 1)[0]);
  return true;
}

// ---------- the tick ----------

/**
 * First half of a tick: every belt bobbin moves one position and collects
 * the first stitch it can see if that stitch is its colour. Then emptied
 * bobbins pop, and bobbins that finished the loop go to the rack - or, if
 * the rack is full, the game is lost (the bobbin stays on the belt, frozen).
 */
export function advance(s: PlayState, events: TickEvent[] = []): TickEvent[] {
  if (s.status !== "play") return events;
  for (const b of s.belt) {
    b.prev = b.i;
    b.i++;
    if (b.i >= 0 && b.i < s.L && b.n > 0) {
      const p = lineFirst(s.grid, b.i);
      if (p && s.grid[p[1]][p[0]] === b.c) {
        s.grid[p[1]][p[0]] = null;
        b.n--;
        s.left--;
        events.push({ type: "collect", x: p[0], y: p[1], bobbin: b });
      }
    }
  }
  const keep: BeltBobbin[] = [];
  for (const b of s.belt) {
    if (b.n === 0) {
      events.push({ type: "empty", bobbin: b });
      continue;
    }
    if (b.i >= s.L) {
      if (s.rack.length >= s.rackSize) {
        if (s.status === "play") events.push({ type: "lost", bobbin: b });
        s.status = "lost";
        keep.push(b);
        continue;
      }
      s.rack.push(b);
      events.push({ type: "rack", bobbin: b });
      continue;
    }
    keep.push(b);
  }
  s.belt = keep;
  if (s.status === "play" && s.left === 0) {
    s.status = "won";
    events.push({ type: "won" });
  }
  return events;
}

/**
 * Second half of a tick: if the entry corner is open, one bobbin enters -
 * the next pending one, or while auto-finishing the next from pending, then
 * the rack, then the first non-empty supply column.
 */
export function feed(s: PlayState, events: TickEvent[] = []): TickEvent[] {
  if (s.status !== "play" || !entryOpen(s)) return events;
  let b = s.pending.shift();
  if (!b && isAutoFinishing(s)) b = s.rack.shift() ?? s.cols.find((col) => col.length)?.shift();
  if (b) {
    b.i = -1;
    b.prev = -1;
    s.belt.push(b);
    events.push({ type: "enter", bobbin: b });
  }
  return events;
}

/** One full game tick. */
export function step(s: PlayState): TickEvent[] {
  const events = advance(s);
  return feed(s, events);
}
