// Send feedback: when a bobbin is tapped, a copy of its spool flies from the
// button to wherever that bobbin now is on the board (waiting on the start
// pad, or already moving up the belt), so it lands exactly on itself. The
// board hides the real bobbin until the flight lands, so there's never two.
//
// Purely visual: the send has already happened in the game state, and the
// flight copy ignores pointer events, so it can't delay or swallow a tap.

import type { BeltBobbin } from "../core/rules.ts";
import { spoolSVG } from "./spool.ts";

export const FLIGHT_MS = 320;

export interface Point {
  x: number;
  y: number;
  size: number;
}

/** Ease-out cubic: quick start, gentle landing. */
export function ease(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - (1 - c) ** 3;
}

/** Centre and size at progress t (0..1) from `from` to `to`. */
export function lerpPoint(from: Point, to: Point, t: number): Point {
  const e = ease(t);
  return {
    x: from.x + (to.x - from.x) * e,
    y: from.y + (to.y - from.y) * e,
    size: from.size + (to.size - from.size) * e,
  };
}

interface Flight {
  bobbin: BeltBobbin;
  from: Point;
  last: Point;
  t0: number;
  el: HTMLElement;
}

export class FlightLayer {
  private readonly flights: Flight[] = [];
  private readonly flying = new Set<BeltBobbin>();
  private readonly host: HTMLElement;

  constructor(host: HTMLElement = document.body) {
    this.host = host;
  }

  /** Bobbins currently in the air (the board shouldn't draw them yet). */
  get inFlight(): ReadonlySet<BeltBobbin> {
    return this.flying;
  }

  /** Launch from a tapped button's on-screen box. */
  launch(bobbin: BeltBobbin, from: DOMRect, now: number): void {
    const start = { x: from.left + from.width / 2, y: from.top + from.height / 2, size: Math.min(from.width, from.height) };
    const el = document.createElement("div");
    el.className = "flight";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = spoolSVG(bobbin.c, bobbin.n, 40);
    this.host.appendChild(el);
    const flight = { bobbin, from: start, last: start, t0: now, el };
    this.flights.push(flight);
    this.flying.add(bobbin);
    this.place(flight, start);
  }

  /**
   * Moves every flight one frame. `target` says where a bobbin is on the
   * board now (null if it has already left the belt).
   */
  update(now: number, target: (b: BeltBobbin) => Point | null): void {
    for (let i = this.flights.length - 1; i >= 0; i--) {
      const f = this.flights[i];
      const t = (now - f.t0) / FLIGHT_MS;
      const to = target(f.bobbin) ?? f.last;
      if (t >= 1) {
        f.el.remove();
        this.flights.splice(i, 1);
        this.flying.delete(f.bobbin);
        continue;
      }
      f.last = to;
      this.place(f, lerpPoint(f.from, to, t));
    }
  }

  /** Drops every flight at once (new puzzle, restart). */
  clear(): void {
    for (const f of this.flights) f.el.remove();
    this.flights.length = 0;
    this.flying.clear();
  }

  private place(f: Flight, p: Point) {
    // The SVG is 40px; scale it to the current size around its centre.
    const scale = p.size / 40;
    f.el.style.transform = `translate(${p.x - 20}px, ${p.y - 20}px) scale(${scale})`;
  }
}
