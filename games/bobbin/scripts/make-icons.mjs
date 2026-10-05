// Generates Bobbin's app icons (original art: a yarn spool on the site's
// brand green) into games/bobbin/public/, which Vite copies into the build.
// The PNGs are committed; re-run only if the design below changes:
//
//   node games/bobbin/scripts/make-icons.mjs
//
// Colours are the main site's tokens (src/styles/variables.css) written out,
// because icons are static images and can't read CSS custom properties:
// --brand-primary-dark/-light (background), --accent-brand (yarn), and the
// game's spool wood (src/core/palette.ts SPOOL_WOOD).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const BG_DARK = "#2d5a2d";
const BG_LIGHT = "#4a7c4a";
const YARN = "#86efac";
const YARN_STRIPE = "#4fbf7a";
const WOOD = "#C9A27A";
const WOOD_SHADE = "#A9845E";

// `inset` is how much of the canvas the spool art may use: maskable icons
// must keep their content inside the central safe zone (a circle of 80%).
function svg({ rounded, inset }) {
  const s = 512;
  const art = s * inset;
  const o = (s - art) / 2;
  const u = art / 40; // spool drawn on a 40-unit grid, like the game's SVG
  const x = (v) => o + v * u;
  const stripes = [13, 18, 23, 28]
    .map((v) => `<line x1="${x(9)}" y1="${x(v - 1.5)}" x2="${x(31)}" y2="${x(v + 1.5)}"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BG_DARK}"/><stop offset="1" stop-color="${BG_LIGHT}"/></linearGradient></defs>
  <rect width="${s}" height="${s}" rx="${rounded ? s * 0.22 : 0}" fill="url(#g)"/>
  <rect x="${x(9)}" y="${x(8)}" width="${22 * u}" height="${24 * u}" fill="${YARN}"/>
  <g stroke="${YARN_STRIPE}" stroke-width="${1.6 * u}" stroke-linecap="round">${stripes}</g>
  <rect x="${x(5)}" y="${x(3)}" width="${30 * u}" height="${6 * u}" rx="${2 * u}" fill="${WOOD}" stroke="${WOOD_SHADE}" stroke-width="${0.6 * u}"/>
  <rect x="${x(5)}" y="${x(31)}" width="${30 * u}" height="${6 * u}" rx="${2 * u}" fill="${WOOD}" stroke="${WOOD_SHADE}" stroke-width="${0.6 * u}"/>
</svg>`;
}

const out = join(dirname(fileURLToPath(import.meta.url)), "../public");
mkdirSync(join(out, "icons"), { recursive: true });

const any = svg({ rounded: true, inset: 0.72 });
const maskable = svg({ rounded: false, inset: 0.56 });
writeFileSync(join(out, "favicon.svg"), any);
await sharp(Buffer.from(any)).resize(192).png().toFile(join(out, "icons/icon-192.png"));
await sharp(Buffer.from(any)).resize(512).png().toFile(join(out, "icons/icon-512.png"));
await sharp(Buffer.from(maskable)).resize(512).png().toFile(join(out, "icons/icon-maskable-512.png"));
// iOS ignores the manifest's icons and doesn't round transparent corners, so
// it gets the full-bleed version (it applies its own mask).
await sharp(Buffer.from(maskable)).resize(180).png().toFile(join(out, "icons/apple-touch-icon.png"));
console.log("Wrote Bobbin icons to", out);
