// Fixed-timestep clock: game logic advances in whole 110 ms ticks no matter
// the frame rate, and requestAnimationFrame only draws, interpolating
// bobbins between their last two belt positions.

export const TICK_MS = 110;
/** Never replay more than this many ticks in one frame (e.g. after a stall). */
const MAX_CATCH_UP = 5;

export interface Frame {
  /** Tick timestamps to run this frame, oldest first. */
  ticks: number[];
  /** How far (0..1) the current frame is between the last tick and the next. */
  alpha: number;
}

export class FixedClock {
  private last: number | null = null;
  private readonly tickMs: number;

  constructor(tickMs = TICK_MS) {
    this.tickMs = tickMs;
  }

  frame(now: number): Frame {
    if (this.last === null) this.last = now;
    // After a long gap (tab hidden, debugger), resync rather than fast-forward
    // the belt through dozens of ticks the player never saw.
    if (now - this.last > this.tickMs * MAX_CATCH_UP) this.last = now - this.tickMs;
    const ticks: number[] = [];
    while (now - this.last >= this.tickMs) {
      this.last += this.tickMs;
      ticks.push(this.last);
    }
    return { ticks, alpha: Math.min(1, (now - this.last) / this.tickMs) };
  }

  /** Call when the page becomes visible again. */
  reset(now: number): void {
    this.last = now;
  }
}
