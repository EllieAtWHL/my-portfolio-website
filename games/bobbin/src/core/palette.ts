// The 12 yarn colours. Generation works on the keys, never the hex values,
// so colours can be retuned (e.g. for colour-blind players, WEB-203) without
// changing what any puzzle code builds. COLOUR_KEYS' order is part of
// generator v1 - the generator shuffles it to choose a puzzle's colours.

export const COLOUR_KEYS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"] as const;
export type Colour = (typeof COLOUR_KEYS)[number];

export const PALETTE: Record<Colour, string> = {
  a: "#EF5B5B",
  b: "#F4A340",
  c: "#F2C94C",
  d: "#5FB36A",
  e: "#3FB8AF",
  f: "#8FD3DA",
  g: "#6C9BE8",
  h: "#A98BE0",
  i: "#F29BC0",
  j: "#4A3560",
  k: "#FFFFFF",
  l: "#E9C99A",
};

export const COLOUR_NAMES: Record<Colour, string> = {
  a: "red",
  b: "orange",
  c: "yellow",
  d: "green",
  e: "teal",
  f: "sky blue",
  g: "blue",
  h: "lilac",
  i: "pink",
  j: "plum",
  k: "white",
  l: "oatmeal",
};

// Game art, like the yarn colours above (not UI chrome, so not site tokens):
// the wooden spool ends and the outline that keeps capacity numbers readable
// on any yarn colour.
export const SPOOL_WOOD = "#C9A27A";
export const SPOOL_NUMBER = "#FFFFFF";
export const SPOOL_NUMBER_OUTLINE = "rgba(40, 28, 56, 0.85)";

/** Lighten (amt > 0) or darken (amt < 0) a #RRGGBB colour. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}
