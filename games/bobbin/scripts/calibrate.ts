// Calibration report: generates N puzzles per difficulty and measures how the
// simulated players do, how many bobbins there are, and how long generation
// takes - the numbers behind reference/bobbin/README.md's "Measured results".
// Run whenever difficulty or the generator changes:
//
//   npm run bobbin:calibrate          # 30 puzzles per difficulty
//   npm run bobbin:calibrate -- 100   # more puzzles, tighter numbers
//
// The codes are fixed (not random), so two runs on the same generator agree.
import { formatCode } from "../src/core/codes.ts";
import { mulberry32 } from "../src/core/rng.ts";
import { DIFFICULTIES, type Difficulty } from "../src/gen/difficulty.ts";
import { generate } from "../src/gen/generate.ts";
import { winRate } from "../src/sim/simulate.ts";

const N = Number(process.argv[2]) || 30;
// Independent re-measurement with more runs than generation uses. Expect it to
// read a little easier than the generation estimate: generation *selects*
// puzzles whose noisy 12-run estimate landed in band, so a fresh measurement
// regresses toward the mean (selection bias, not a bug).
const CASUAL_RUNS = 24;
const SMART_RUNS = 10;

const pct = (x: number) => `${Math.round(x * 100)}%`;
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

const rows: Record<string, string[]> = {
  "Casual target band": [],
  "Casual win rate (generation's 12-run estimate)": [],
  "Casual win rate (independent re-measure)": [],
  "Smart win rate": [],
  "In band / closest miss / fallback": [],
  "Average bobbins": [],
  "Generation time (avg / max)": [],
};

for (const d of ["E", "M", "H"] as Difficulty[]) {
  const cfg = DIFFICULTIES[d];
  const casual: number[] = [];
  const casualAtGeneration: number[] = [];
  const smart: number[] = [];
  const bobbins: number[] = [];
  const times: number[] = [];
  const sources = { band: 0, closest: 0, fallback: 0 };
  for (let i = 0; i < N; i++) {
    const code = formatCode(1, d, (i * 104729 + 17) % 32 ** 4);
    const t0 = performance.now();
    const p = generate(code);
    times.push(performance.now() - t0);
    sources[p.source]++;
    casualAtGeneration.push(p.casual ?? 0);
    bobbins.push(p.cols.flat().length);
    const rng = mulberry32(i + 1);
    casual.push(winRate(p.grid, p.cols, p.cfg, "casual", CASUAL_RUNS, rng));
    smart.push(winRate(p.grid, p.cols, p.cfg, "smart", SMART_RUNS, rng));
  }
  rows["Casual target band"].push(`${pct(cfg.casual[0])}-${pct(cfg.casual[1])}`);
  rows["Casual win rate (generation's 12-run estimate)"].push(pct(avg(casualAtGeneration)));
  rows["Casual win rate (independent re-measure)"].push(pct(avg(casual)));
  rows["Smart win rate"].push(pct(avg(smart)));
  rows["In band / closest miss / fallback"].push(`${sources.band} / ${sources.closest} / ${sources.fallback}`);
  rows["Average bobbins"].push(avg(bobbins).toFixed(1));
  rows["Generation time (avg / max)"].push(`${Math.round(avg(times))} / ${Math.round(Math.max(...times))} ms`);
}

console.log(`Bobbin calibration: ${N} puzzles per difficulty (Node ${process.version})\n`);
console.log("| | Easy | Medium | Hard |\n|---|---|---|---|");
for (const [label, cells] of Object.entries(rows)) console.log(`| ${label} | ${cells.join(" | ")} |`);
