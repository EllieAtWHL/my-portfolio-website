// Puzzle code -> puzzle (generator v1). Pure and deterministic: the same code
// builds exactly the same puzzle on every device, so nothing in here may use
// Math.random, the clock, or engine-approximated maths (see core/math.ts).

import { parseCode } from "../core/codes.ts";
import { COLOUR_KEYS, type Colour } from "../core/palette.ts";
import type { Bobbin, Grid } from "../core/rules.ts";
import { mulberry32, shuffle } from "../core/rng.ts";
import { winRate } from "../sim/simulate.ts";
import { deal, peelBobbins, scramble } from "./bobbins.ts";
import { DIFFICULTIES, type DifficultyConfig } from "./difficulty.ts";
import { genPicture, genRings, type PictureMath } from "./pictures.ts";

export interface Puzzle {
  code: string;
  grid: Grid;
  /** Bobbins per supply column, front first. */
  cols: Bobbin[][];
  cfg: DifficultyConfig;
  /** Measured win rates; absent on the last-resort fallback puzzle. */
  casual?: number;
  smart?: number;
  /** How the puzzle was chosen: in the target band, closest miss, or fallback. */
  source: "band" | "closest" | "fallback";
}

const ATTEMPTS = 30;
const SMART_RUNS = 5;
const CASUAL_RUNS = 12;

export interface GenerateOptions {
  /** Test-only: swap the picture maths (see the prototype-fidelity test). */
  math?: PictureMath;
}

export function generate(input: string, options: GenerateOptions = {}): Puzzle {
  const p = parseCode(input);
  if (!p) throw new Error(`Invalid puzzle code: ${input}`);
  const cfg = DIFFICULTIES[p.difficulty];
  const base = mulberry32(p.seed * 7919 + p.difficulty.charCodeAt(0));
  let best: { puzzle: Puzzle; miss: number } | null = null;

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    // Each attempt gets its own child rng, so retries stay deterministic.
    const rng = mulberry32(Math.floor(base() * 4294967296));
    const size = cfg.size[0] + Math.floor(rng() * (cfg.size[1] - cfg.size[0] + 1));
    const nCol = cfg.colours[0] + Math.floor(rng() * (cfg.colours[1] - cfg.colours[0] + 1));
    const colours = shuffle(rng, [...COLOUR_KEYS] as Colour[]).slice(0, nCol);
    const grid = genPicture(rng, size, size, colours, cfg.pics, options.math);
    if (new Set(grid.flat()).size < nCol - 1) continue;

    const bobbins = scramble(rng, peelBobbins(grid, cfg.maxCap), cfg.window);
    const cols = deal(rng, bobbins, cfg.deal);

    // Must be winnable by a careful player...
    const smart = winRate(grid, cols, cfg, "smart", SMART_RUNS, rng);
    if (smart === 0) continue;
    // ...and land in the band for a casual one.
    const casual = winRate(grid, cols, cfg, "casual", CASUAL_RUNS, rng);
    const puzzle: Puzzle = { code: p.code, grid, cols, cfg, casual, smart, source: "band" };
    if (casual >= cfg.casual[0] && casual <= cfg.casual[1]) return puzzle;
    const miss = casual < cfg.casual[0] ? cfg.casual[0] - casual : casual - cfg.casual[1];
    if (!best || miss < best.miss) best = { puzzle: { ...puzzle, source: "closest" }, miss };
  }

  if (best) return best.puzzle;

  // Last resort: concentric rings with a roomy rack and belt, always solvable.
  const rng = mulberry32(p.seed);
  const colours = shuffle(rng, [...COLOUR_KEYS] as Colour[]).slice(0, cfg.colours[0]);
  const grid = genRings(rng, cfg.size[0], cfg.size[0], colours, options.math);
  const cols: Bobbin[][] = [[], [], []];
  peelBobbins(grid, cfg.maxCap).forEach((b, i) => cols[i % 3].push(b));
  return { code: p.code, grid, cols, cfg: { ...cfg, rack: 5, belt: 5 }, source: "fallback" };
}
