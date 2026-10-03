// Turning a picture into bobbins (generator v1).

import type { Colour } from "../core/palette.ts";
import { exposed, type Bobbin, type Grid } from "../core/rules.ts";
import type { Rng } from "../core/rng.ts";
import { COLUMNS, type DealMode } from "./difficulty.ts";

/**
 * Peel the picture from the outside in: repeatedly take the colour with the
 * most exposed stitches, collect all of its exposed stitches, and record a
 * bobbin of that size. Then merge consecutive same-colour bobbins, fold any
 * bobbin under 3 into another of its colour, and split anything above
 * maxCap into near-equal parts. Per colour, the capacities sum to exactly
 * that colour's stitch count.
 */
export function peelBobbins(grid: Grid, maxCap: number): Bobbin[] {
  const g = grid.map((row) => row.slice());
  const out: Bobbin[] = [];
  let left = g.flat().filter(Boolean).length;
  while (left > 0) {
    const ex = exposed(g);
    // Map keeps first-seen order, which breaks ties in the stable sort below.
    const counts = new Map<Colour, number>();
    for (const [x, y] of ex) {
      const c = g[y][x]!;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const c = [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)!)[0];
    for (const [x, y] of ex) {
      if (g[y][x] === c) {
        g[y][x] = null;
        left--;
      }
    }
    const last = out[out.length - 1];
    if (last && last.c === c) last.n += counts.get(c)!;
    else out.push({ c, n: counts.get(c)! });
  }
  for (let i = 0; i < out.length; i++) {
    if (out[i].n >= 3) continue;
    let j = -1;
    for (let k = i - 1; k >= 0; k--) {
      if (out[k].c === out[i].c) {
        j = k;
        break;
      }
    }
    if (j < 0) {
      for (let k = i + 1; k < out.length; k++) {
        if (out[k].c === out[i].c) {
          j = k;
          break;
        }
      }
    }
    if (j >= 0) {
      out[j].n += out[i].n;
      out.splice(i, 1);
      i--;
    }
  }
  const res: Bobbin[] = [];
  for (const b of out) {
    let n = b.n;
    for (let parts = Math.ceil(b.n / maxCap); parts > 0; parts--) {
      const size = Math.round(n / parts);
      res.push({ c: b.c, n: size });
      n -= size;
    }
  }
  return res;
}

/** Sort by index + random * window: 0 keeps peel order, ~100 is a full shuffle. */
export function scramble(rng: Rng, bobbins: Bobbin[], window: number): Bobbin[] {
  return bobbins
    .map((b, i) => ({ b, k: i + rng() * window }))
    .sort((a, b) => a.k - b.k)
    .map((o) => o.b);
}

export function deal(rng: Rng, bobbins: Bobbin[], mode: DealMode): Bobbin[][] {
  const cols: Bobbin[][] = Array.from({ length: COLUMNS }, () => []);
  bobbins.forEach((b, i) => {
    let k = i % COLUMNS;
    // `mode === "mixed" && rng() < 0.4` must short-circuit: "random" draws once, not twice.
    if (mode === "random" || (mode === "mixed" && rng() < 0.4)) k = Math.floor(rng() * COLUMNS);
    cols[k].push(b);
  });
  return cols;
}
