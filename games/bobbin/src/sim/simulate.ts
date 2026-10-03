// Simulated players, used to validate and calibrate generated puzzles. They
// play by exactly the game's rules because they call the same advance/feed
// as the game (core/rules.ts). Their rng() draws are part of generator v1:
// changing a policy changes which attempt each code accepts.

import {
  advance,
  createPlayState,
  entryOpen,
  exposed,
  feed,
  isAutoFinishing,
  type Bobbin,
  type Grid,
  type PlayState,
} from "../core/rules.ts";
import { shuffle, type Rng } from "../core/rng.ts";
import type { Colour } from "../core/palette.ts";

/**
 * smart:  plans colour by colour - sends a bobbin whose colour is exposed and
 *         not already on the belt (rack first), and banks a bobbin onto the
 *         rack when nothing is useful and the belt is empty.
 * casual: reacts without planning - only sends while fewer than 2 bobbins are
 *         on the belt, picking an exposed colour 80% of the time.
 */
export type Policy = "smart" | "casual";

export interface SimConfig {
  rack: number;
  belt: number;
}

export interface SimResult {
  won: boolean;
  /** Most bobbins on the rack at once. */
  peak: number;
}

const MAX_TICKS = 6000;

type Choice = ["col" | "rack", number];

function decide(s: PlayState, policy: Policy, ex: Set<Colour>, rng: Rng): Choice | null {
  const fronts = [0, 1, 2].filter((k) => s.cols[k].length);
  if (policy === "smart") {
    const onBelt = new Set(s.belt.map((b) => b.c));
    const useful = (b: Bobbin) => ex.has(b.c) && !onBelt.has(b.c);
    const ri = s.rack.findIndex(useful);
    if (ri >= 0) return ["rack", ri];
    const good = shuffle(rng, fronts.filter((k) => useful(s.cols[k][0])));
    if (good.length) return ["col", good[0]];
    if (s.belt.length === 0 && s.rack.length < s.rackSize && fronts.length) {
      // nothing useful: bank a random front onto the rack
      return ["col", fronts[Math.floor(rng() * fronts.length)]];
    }
    if (s.belt.length === 0 && s.rack.length) return ["rack", 0];
    return null;
  }
  if (s.belt.length >= 2) return null;
  const opts: Choice[] = [
    ...fronts.map((k): Choice => ["col", k]),
    ...s.rack.map((_, i): Choice => ["rack", i]),
  ];
  const seen = opts.filter(([w, k]) => ex.has(w === "col" ? s.cols[k][0].c : s.rack[k].c));
  // `seen.length && rng()` must short-circuit: no draw when nothing is exposed.
  const pool = seen.length && rng() < 0.8 ? seen : opts;
  return pool.length ? pool[Math.floor(rng() * pool.length)] : null;
}

export function simulate(
  grid: Grid,
  cols: Bobbin[][],
  cfg: SimConfig,
  policy: Policy,
  rng: Rng,
): SimResult {
  const s = createPlayState(grid, cols, cfg.rack, cfg.belt);
  let peak = 0;
  // exposed() is the expensive part; colours only change when a stitch goes.
  let exLeft = -1;
  let ex = new Set<Colour>();
  for (let t = 0; t < MAX_TICKS && s.status === "play"; t++) {
    advance(s);
    peak = Math.max(peak, s.rack.length);
    if (s.status !== "play") break;
    if (!entryOpen(s)) continue;
    if (!isAutoFinishing(s)) {
      if (exLeft !== s.left) {
        ex = new Set(exposed(s.grid).map(([x, y]) => s.grid[y][x]!));
        exLeft = s.left;
      }
      const choice = decide(s, policy, ex, rng);
      if (choice) {
        const [where, k] = choice;
        s.pending.push(where === "rack" ? s.rack.splice(k, 1)[0] : s.cols[k].shift()!);
      }
    }
    feed(s);
  }
  return { won: s.status === "won", peak };
}

export function winRate(
  grid: Grid,
  cols: Bobbin[][],
  cfg: SimConfig,
  policy: Policy,
  runs: number,
  rng: Rng,
): number {
  let wins = 0;
  for (let i = 0; i < runs; i++) if (simulate(grid, cols, cfg, policy, rng).won) wins++;
  return wins / runs;
}
