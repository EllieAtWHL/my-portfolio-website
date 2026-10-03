// The spool as inline SVG, for the DOM rack and supply columns. Same art as
// the canvas spool in render/canvas.ts.
import {
  PALETTE,
  SPOOL_NUMBER,
  SPOOL_NUMBER_OUTLINE,
  SPOOL_WOOD,
  shade,
  type Colour,
} from "../core/palette.ts";

export function spoolSVG(c: Colour, n: number, size: number): string {
  const colour = PALETTE[c];
  const stripe = shade(colour, -0.2);
  const lines = [12, 17, 22, 27].map((v) => `<line x1="9" y1="${v - 1.5}" x2="31" y2="${v + 1.5}"/>`).join("");
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <rect x="6" y="3" width="28" height="6" rx="2" fill="${SPOOL_WOOD}"/><rect x="6" y="31" width="28" height="6" rx="2" fill="${SPOOL_WOOD}"/>
    <rect x="9" y="9" width="22" height="22" fill="${colour}"/>
    <g stroke="${stripe}" stroke-width="1.6">${lines}</g>
    <text x="20" y="21" text-anchor="middle" dominant-baseline="middle" font-family="Nokora, sans-serif" font-weight="700" font-size="15" fill="${SPOOL_NUMBER}" stroke="${SPOOL_NUMBER_OUTLINE}" stroke-width="3.2" paint-order="stroke">${n}</text>
  </svg>`;
}
