// Picture generators (generator v1). The order of every rng() call is part
// of what a code builds - don't reorder draws, add draws, or "simplify" a
// short-circuit that skips one, without a generator version bump.

import { atan2, hypot, sin } from "../core/math.ts";
import type { Colour } from "../core/palette.ts";
import type { Grid } from "../core/rules.ts";
import { pick, type Rng } from "../core/rng.ts";
import type { PictureType } from "./difficulty.ts";

export interface PictureMath {
  sin: (x: number) => number;
  atan2: (y: number, x: number) => number;
  hypot: (x: number, y: number) => number;
}

// Deterministic maths by default (see core/math.ts); the prototype-fidelity
// test passes the native Math functions instead.
const DETERMINISTIC: PictureMath = { sin, atan2, hypot };

type ColourGrid = Colour[][];

function fill(W: number, H: number, f: (x: number, y: number) => Colour): ColourGrid {
  return Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => f(x, y)));
}

// Concentric circles, diamonds or squares, sometimes split into alternating sectors.
export function genRings(rng: Rng, W: number, H: number, cols: Colour[], m: PictureMath = DETERMINISTIC): ColourGrid {
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  const bw = pick(rng, [1, 1.5, 2]);
  const metric = pick(rng, ["circle", "diamond", "square"] as const);
  const sectors = rng() < 0.35 ? pick(rng, [4, 8]) : 0;
  return fill(W, H, (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const d =
      metric === "circle"
        ? m.hypot(dx, dy)
        : metric === "diamond"
          ? (Math.abs(dx) + Math.abs(dy)) * 0.75
          : Math.max(Math.abs(dx), Math.abs(dy));
    let idx = Math.floor(d / bw);
    if (sectors) {
      const a = m.atan2(dy, dx) + Math.PI;
      idx += Math.floor(a / ((2 * Math.PI) / sectors)) % 2;
    }
    return cols[idx % cols.length];
  });
}

// Horizontal or diagonal sine-wave stripes.
export function genWaves(rng: Rng, W: number, H: number, cols: Colour[], m: PictureMath = DETERMINISTIC): ColourGrid {
  const amp = 0.8 + rng() * 2;
  const freq = 0.4 + rng() * 0.7;
  const ph = rng() * 6.28;
  const bw = pick(rng, [2, 2, 3]);
  const diag = rng() < 0.4;
  return fill(W, H, (x, y) => {
    const v = (diag ? (x + y) / 1.4 : y) + amp * m.sin(x * freq + ph);
    return cols[((Math.floor(v / bw) % cols.length) + cols.length) % cols.length];
  });
}

// Left-right mirrored patchwork of 2x2 or 3x3 tiles. Tiles are created lazily
// in row-major order, which fixes the order of their rng() draws.
export function genQuilt(rng: Rng, W: number, H: number, cols: Colour[]): ColourGrid {
  const t = pick(rng, [2, 3]);
  const tiles = new Map<string, { a: Colour; b: Colour; style: "solid" | "diag" | "dot" }>();
  return fill(W, H, (x, y) => {
    const tx = Math.floor(Math.min(x, W - 1 - x) / t);
    const ty = Math.floor(y / t);
    const key = tx + "," + ty;
    let tile = tiles.get(key);
    if (!tile) {
      const a = pick(rng, cols);
      const b = pick(rng, cols);
      const style = pick(rng, ["solid", "diag", "dot"] as const);
      tile = { a, b, style };
      tiles.set(key, tile);
    }
    const lx = x % t;
    const ly = y % t;
    if (tile.style === "solid") return tile.a;
    if (tile.style === "diag") return lx >= ly ? tile.a : tile.b;
    return lx === Math.floor(t / 2) && ly === Math.floor(t / 2) ? tile.b : tile.a;
  });
}

// Mirrored blob creature with an outline and spots, from smoothed noise.
// Draws onto `base` (mutating it) when given, for the "mix" picture.
export function genSprite(
  rng: Rng,
  W: number,
  H: number,
  cols: Colour[],
  base?: ColourGrid,
  m: PictureMath = DETERMINISTIC,
): ColourGrid {
  const g = base ?? fill(W, H, () => cols[0]);
  const half = Math.ceil(W / 2);
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  let mask = Array.from({ length: H }, (_, y) =>
    Array.from({ length: half }, (_, x) => {
      const d = m.hypot((x - cx) / (W * 0.42), (y - cy) / (H * 0.42));
      return rng() < (d < 1 ? 0.62 - d * 0.25 : 0);
    }),
  );
  for (let it = 0; it < 2; it++) {
    const prev = mask;
    mask = prev.map((row, y) =>
      row.map((v, x) => {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const yy = y + dy;
            let xx = x + dx;
            if (xx >= half) xx = W - 1 - xx;
            if (yy >= 0 && yy < H && xx >= 0 && xx < half && prev[yy][xx]) n++;
          }
        }
        return n >= 5 || (v && n >= 3);
      }),
    );
  }
  const inMask = (x: number, y: number) =>
    y >= 0 && y < H && x >= 0 && x < W && mask[y][x < half ? x : W - 1 - x];
  const body = cols[1];
  const line = cols[2 % cols.length];
  const spot = cols[3 % cols.length];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!inMask(x, y)) continue;
      const edge = !inMask(x - 1, y) || !inMask(x + 1, y) || !inMask(x, y - 1) || !inMask(x, y + 1);
      g[y][x] = edge && cols.length > 2 ? line : body;
    }
  }
  if (cols.length > 3) {
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < half; x++) {
        if (
          inMask(x, y) &&
          inMask(x - 1, y) &&
          inMask(x + 1, y) &&
          inMask(x, y - 1) &&
          inMask(x, y + 1) &&
          rng() < 0.2
        ) {
          g[y][x] = spot;
          g[y][W - 1 - x] = spot;
        }
      }
    }
  }
  return g;
}

export function genPicture(
  rng: Rng,
  W: number,
  H: number,
  cols: Colour[],
  pics: readonly PictureType[],
  m: PictureMath = DETERMINISTIC,
): Grid {
  const type = pick(rng, pics);
  if (type === "rings") return genRings(rng, W, H, cols, m);
  if (type === "waves") return genWaves(rng, W, H, cols, m);
  if (type === "quilt") return genQuilt(rng, W, H, cols);
  if (type === "sprite") return genSprite(rng, W, H, cols, undefined, m);
  // mix: a two-colour wave background with a sprite on top
  const bg = genWaves(rng, W, H, cols.slice(0, 2), m);
  return genSprite(rng, W, H, [cols[0], ...cols.slice(2), cols[1]].slice(0, cols.length), bg, m);
}
