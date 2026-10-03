// One play-through of a puzzle: the core PlayState plus what the screen needs
// on top (visual effects, the first-run flag). All rules come from the shared
// core tick (core/rules.ts) - nothing here may change what a move does, only
// how it's shown. Pure and DOM-free, so it's unit tested directly.

import { PALETTE } from "../core/palette.ts";
import {
  canSend,
  createPlayState,
  isAutoFinishing,
  sendFromColumn,
  sendFromRack,
  step,
  type BeltBobbin,
  type PlayState,
  type TickEvent,
} from "../core/rules.ts";
import type { Puzzle } from "../gen/generate.ts";

/** What the player sees: `finishing` is play with input locked (auto-finish). */
export type Phase = "play" | "finishing" | "won" | "lost";

export const THREAD_MS = 280;
export const POP_MS = 360;

export type Effect =
  // A thread flying from a collected stitch (cell x, y) to its bobbin.
  | { type: "thread"; x: number; y: number; bobbin: BeltBobbin; colour: string; t0: number }
  // A ring where a bobbin emptied (belt position i).
  | { type: "pop"; i: number; colour: string; t0: number };

export class GameSession {
  readonly puzzle: Puzzle;
  readonly state: PlayState;
  effects: Effect[] = [];

  constructor(puzzle: Puzzle) {
    this.puzzle = puzzle;
    this.state = createPlayState(puzzle.grid, puzzle.cols, puzzle.cfg.rack, puzzle.cfg.belt);
  }

  get phase(): Phase {
    const s = this.state;
    if (s.status !== "play") return s.status;
    return isAutoFinishing(s) ? "finishing" : "play";
  }

  /** Whether a tap on a bobbin would do anything right now. */
  get canSend(): boolean {
    return canSend(this.state);
  }

  /** Bobbins on the belt plus those waiting at the entry corner. */
  get beltCount(): number {
    return this.state.belt.length + this.state.pending.length;
  }

  sendColumn(k: number): boolean {
    return sendFromColumn(this.state, k);
  }

  sendRack(k: number): boolean {
    return sendFromRack(this.state, k);
  }

  /** Runs one belt tick at time `now` (ms) and records its effects. */
  tick(now: number): TickEvent[] {
    const events = step(this.state);
    for (const e of events) {
      if (e.type === "collect") {
        this.effects.push({ type: "thread", x: e.x, y: e.y, bobbin: e.bobbin, colour: PALETTE[e.bobbin.c], t0: now });
      } else if (e.type === "empty") {
        this.effects.push({ type: "pop", i: e.bobbin.i, colour: PALETTE[e.bobbin.c], t0: now });
      }
    }
    return events;
  }

  /** Drops finished effects; returns the ones still animating. */
  liveEffects(now: number): Effect[] {
    this.effects = this.effects.filter((e) => now - e.t0 < (e.type === "pop" ? POP_MS : THREAD_MS));
    return this.effects;
  }
}
