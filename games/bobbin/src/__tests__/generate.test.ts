/** @jest-environment node */
import prototype from "./fixtures/prototype-v8.json";
import { formatCode } from "../core/codes.ts";
import { COLOUR_KEYS } from "../core/palette.ts";
import { generate, type Puzzle } from "../gen/generate.ts";
import { DIFFICULTIES, type Difficulty } from "../gen/difficulty.ts";
import { winRate } from "../sim/simulate.ts";
import { mulberry32 } from "../core/rng.ts";

const NATIVE_MATH = { sin: Math.sin, atan2: Math.atan2, hypot: Math.hypot };

const strip = (p: Puzzle) => ({
  grid: p.grid,
  cols: p.cols.map((col) => col.map(({ c, n }) => ({ c, n }))),
  rack: p.cfg.rack,
  belt: p.cfg.belt,
});

// Compact, reviewable form for snapshots: one string per grid row, "cN" per bobbin.
const compact = (p: Puzzle) => ({
  source: p.source,
  grid: p.grid.map((row) => row.map((c) => c ?? ".").join("")),
  cols: p.cols.map((col) => col.map((b) => b.c + b.n).join(" ")),
});

describe("prototype fidelity", () => {
  // fixtures/prototype-v8.json is the prototype's own output
  // (scripts/prototype-fixtures.mjs). With native Math swapped back in, the
  // port must reproduce it exactly - this proves the port, including the
  // shared advance/feed tick the simulator now uses, behaves identically.
  it.each(Object.keys(prototype))("%s matches the prototype exactly", (code) => {
    expect(strip(generate(code, { math: NATIVE_MATH }))).toEqual(
      (prototype as Record<string, unknown>)[code],
    );
  });

  // The deterministic maths (core/math.ts) only differs from native Math in
  // the last bit, so it shouldn't change these puzzles either.
  it.each(Object.keys(prototype))("%s is unchanged by the deterministic maths", (code) => {
    expect(strip(generate(code))).toEqual((prototype as Record<string, unknown>)[code]);
  });
});

describe("golden snapshots (generator v1)", () => {
  // These pin exactly what v1 codes build. If one fails, the generator
  // changed: that's a generator version bump (see core/codes.ts), never a
  // `jest -u`.
  const codes = ["E-2222", "E-4K7P", "E-ZZZZ", "M-2222", "M-4K7P", "M-ZZZZ", "H-2222", "H-4K7P", "H-ZZZZ"];
  it.each(codes)("%s", (code) => {
    expect(compact(generate(code))).toMatchSnapshot();
  });

  it("builds the same puzzle every time, whatever the input formatting", () => {
    expect(generate("m4k7p")).toEqual(generate("M-4K7P"));
  });
});

describe("invariants", () => {
  const SAMPLES = 8;
  const cases: [string, Difficulty][] = [];
  for (const d of ["E", "M", "H"] as const) {
    for (let i = 0; i < SAMPLES; i++) cases.push([formatCode(1, d, (i * 131071 + 977) % 32 ** 4), d]);
  }

  it.each(cases)("%s", (code, d) => {
    const p = generate(code);
    const cfg = DIFFICULTIES[d];
    expect(p.code).toBe(code);

    expect(p.grid.length).toBeGreaterThanOrEqual(cfg.size[0]);
    expect(p.grid.length).toBeLessThanOrEqual(cfg.size[1]);
    for (const row of p.grid) expect(row).toHaveLength(p.grid.length);

    // Per colour, total bobbin capacity is exactly that colour's stitch count.
    const stitches = new Map<string, number>();
    for (const c of p.grid.flat()) stitches.set(c!, (stitches.get(c!) ?? 0) + 1);
    const capacity = new Map<string, number>();
    for (const b of p.cols.flat()) capacity.set(b.c, (capacity.get(b.c) ?? 0) + b.n);
    expect(capacity).toEqual(stitches);

    for (const b of p.cols.flat()) {
      expect(COLOUR_KEYS).toContain(b.c);
      expect(b.n).toBeGreaterThanOrEqual(1);
      expect(b.n).toBeLessThanOrEqual(cfg.maxCap);
    }
    expect(p.cols).toHaveLength(3);

    // Winnable by a careful player (generation already demanded it, but
    // check independently with a fresh rng).
    expect(winRate(p.grid, p.cols, p.cfg, "smart", 10, mulberry32(1))).toBeGreaterThan(0);
  });
});

describe("generate", () => {
  it("rejects invalid codes", () => {
    expect(() => generate("nope")).toThrow("Invalid puzzle code");
  });

  it("keeps measured win rates on the puzzle", () => {
    const p = generate("H-4K7P");
    expect(p.source).not.toBe("fallback");
    expect(p.smart).toBeGreaterThan(0);
    expect(typeof p.casual).toBe("number");
  });
});
