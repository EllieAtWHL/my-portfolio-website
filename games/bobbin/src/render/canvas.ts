// Draws the board: the belt round the outside, the knitted picture in the
// middle, the bobbins travelling the belt, and the thread/pop effects.
// Colours for the belt and panel come from CSS custom properties
// (styles.css), so they follow the site's design tokens and theme; the yarn
// and spool colours are game art (core/palette.ts).

import { PALETTE, SPOOL_NUMBER, SPOOL_NUMBER_OUTLINE, SPOOL_WOOD, shade } from "../core/palette.ts";
import type { BeltBobbin } from "../core/rules.ts";
import { POP_MS, THREAD_MS, type GameSession } from "../game/session.ts";

export interface BoardColours {
  belt: string;
  beltStitch: string;
  dock: string;
  panel: string;
  empty: string;
  /** shade() amount for filled-stitch outlines: < 0 darkens, > 0 lightens. */
  outlineShade: number;
  font: string;
}

export function readBoardColours(root: HTMLElement = document.documentElement): BoardColours {
  const css = getComputedStyle(root);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    belt: v("--bobbin-belt"),
    beltStitch: v("--bobbin-belt-stitch"),
    dock: v("--bobbin-dock"),
    outlineShade: Number(v("--bobbin-stitch-outline-shade")) || -0.22,
    panel: v("--bobbin-panel"),
    empty: v("--bobbin-empty-stitch"),
    font: v("--bobbin-font") || "sans-serif",
  };
}

export class BoardRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private size = 360;
  private beltW = 40;
  private cell = 20;
  private bx = 0;
  private by = 0;
  private W = 1;
  private H = 1;
  private L = 4;
  private dashOffset = 0;
  colours: BoardColours;
  reduceMotion = false;

  constructor(canvas: HTMLCanvasElement, colours: BoardColours) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.colours = colours;
  }

  /** Sizes the canvas to its container. Ignores transient near-zero widths. */
  layout(W: number, H: number): void {
    this.W = W;
    this.H = H;
    this.L = 2 * W + 2 * H;
    const width = this.canvas.parentElement?.clientWidth ?? 0;
    if (width < 120) return;
    const dpr = window.devicePixelRatio || 1;
    this.size = width;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(width * dpr);
    this.canvas.style.height = `${width}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.beltW = width * 0.11;
    const inner = width - 2 * this.beltW - 12;
    this.cell = inner / Math.max(W, H);
    this.bx = (width - this.cell * W) / 2;
    this.by = (width - this.cell * H) / 2;
  }

  /** Pixel centre of belt position i (-1 and L are the entry/exit corner). */
  beltPoint(i: number): [number, number] {
    const { size: S, beltW, cell, bx, by, W, H, L } = this;
    const m = beltW / 2;
    if (i < 0 || i >= L) return [m, S - m];
    if (i < H) return [m, by + (H - 1 - i + 0.5) * cell];
    if (i < H + W) return [bx + (i - H + 0.5) * cell, m];
    if (i < 2 * H + W) return [S - m, by + (i - H - W + 0.5) * cell];
    return [bx + (W - 1 - (i - 2 * H - W) + 0.5) * cell, S - m];
  }

  private cellPoint(x: number, y: number): [number, number] {
    return [this.bx + (x + 0.5) * this.cell, this.by + (y + 0.5) * this.cell];
  }

  private bobbinPoint(b: BeltBobbin, alpha: number): [number, number] {
    const a = this.beltPoint(b.prev);
    const c = this.beltPoint(b.i);
    return [a[0] + (c[0] - a[0]) * alpha, a[1] + (c[1] - a[1]) * alpha];
  }

  draw(session: GameSession, now: number, alpha: number, tickClock: number): void {
    const { ctx, size: S, beltW, colours } = this;
    const s = session.state;
    // Once lost, ticks stop: freeze bobbins where they are rather than replaying their last step.
    const f = s.status === "lost" ? 1 : alpha;
    ctx.clearRect(0, 0, S, S);

    // Belt: a dark rounded track with a stitched dashed centre line that
    // moves while bobbins are travelling (not under reduced motion).
    const m = beltW / 2;
    const track = () => {
      ctx.beginPath();
      // Radii clockwise from top-left; the bottom-left corner stays square,
      // so the start/finish station there reads as a distinct point.
      const r = beltW * 0.6;
      if (ctx.roundRect) ctx.roundRect(m, m, S - beltW, S - beltW, [r, r, r, 0]);
      else ctx.rect(m, m, S - beltW, S - beltW);
      ctx.stroke();
    };
    ctx.strokeStyle = colours.belt;
    ctx.lineWidth = beltW * 0.92;
    ctx.lineJoin = "round";
    track();
    ctx.save();
    ctx.setLineDash([beltW * 0.18, beltW * 0.22]);
    if (s.belt.length > 0 && s.status === "play" && !this.reduceMotion) {
      this.dashOffset = -((tickClock / 110) * ((S - 4 * m) / (this.L / 4))) % (beltW * 0.4);
    }
    ctx.lineDashOffset = this.dashOffset;
    ctx.strokeStyle = colours.beltStitch;
    ctx.lineWidth = 2;
    track();
    ctx.restore();

    this.drawDock();

    // Panel and stitches: light panel in light mode, dark in dark mode.
    ctx.fillStyle = colours.panel;
    this.roundRect(beltW + 2, beltW + 2, S - 2 * beltW - 4, S - 2 * beltW - 4, 12);
    for (let y = 0; y < this.H; y++) {
      for (let x = 0; x < this.W; x++) {
        const [cx, cy] = this.cellPoint(x, y);
        const c = s.grid[y][x];
        this.stitch(cx, cy, this.cell, c ? PALETTE[c] : colours.empty, !!c);
      }
    }

    // Effects
    for (const e of session.liveEffects(now)) {
      if (e.type === "thread") {
        const t = (now - e.t0) / THREAD_MS;
        const [sx, sy] = this.cellPoint(e.x, e.y);
        // A bobbin that emptied on this stitch has already left the belt:
        // aim at where it popped, so its last thread still flies to it.
        const [tx, ty] = s.belt.includes(e.bobbin) ? this.bobbinPoint(e.bobbin, f) : this.beltPoint(e.bobbin.i);
        const hx = sx + (tx - sx) * t;
        const hy = sy + (ty - sy) * t;
        ctx.strokeStyle = e.colour;
        ctx.lineWidth = Math.max(2, this.cell * 0.14);
        ctx.lineCap = "round";
        ctx.globalAlpha = 1 - t * 0.6;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.quadraticCurveTo((hx + tx) / 2 + this.cell * 0.3, (hy + ty) / 2 - this.cell * 0.3, tx, ty);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        const t = (now - e.t0) / POP_MS;
        const [px, py] = this.beltPoint(e.i);
        ctx.strokeStyle = e.colour;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1 - t;
        ctx.beginPath();
        ctx.arc(px, py, beltW * 0.3 + t * beltW * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // Bobbins on the belt, and the next one waiting at the entry corner.
    const r = beltW * 0.4;
    for (const b of s.belt) {
      const [x, y] = this.bobbinPoint(b, f);
      this.spool(x, y, r, PALETTE[b.c], b.n);
    }
    if (s.pending.length) {
      const [x, y] = this.beltPoint(-1);
      this.spool(x, y, r * 0.9, PALETTE[s.pending[0].c], s.pending[0].n);
    }
  }

  // The start/finish point: bobbins wait on a pad at the bottom-left
  // corner, leave up the left side and come home along the bottom. Chevrons
  // on the belt show both directions; drawn under the bobbins.
  private drawDock() {
    const { ctx, beltW, colours } = this;
    const [cx, cy] = this.beltPoint(-1);
    ctx.save();
    ctx.fillStyle = colours.dock;
    ctx.strokeStyle = colours.belt;
    ctx.lineWidth = Math.max(2, beltW * 0.06);
    ctx.beginPath();
    ctx.arc(cx, cy, beltW * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // A small ring inside the pad: the "loop" bobbins go round and return to.
    ctx.beginPath();
    ctx.arc(cx, cy, beltW * 0.16, 0, Math.PI * 2);
    ctx.stroke();

    const chevron = (x: number, y: number, angle: number) => {
      const r = beltW * 0.17;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-r, r * 0.6);
      ctx.lineTo(0, -r * 0.6);
      ctx.lineTo(r, r * 0.6);
      ctx.stroke();
      ctx.restore();
    };
    ctx.strokeStyle = colours.dock;
    ctx.lineWidth = Math.max(2, beltW * 0.08);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Out: pointing up the left side, just above the pad.
    const out = this.beltPoint(0);
    chevron(cx, (cy + out[1]) / 2 - beltW * 0.35, 0);
    chevron(cx, (cy + out[1]) / 2 - beltW * 0.75, 0);
    // Home: pointing left along the bottom, just right of the pad.
    const home = this.beltPoint(this.L - 1);
    chevron((cx + home[0]) / 2 + beltW * 0.75, cy, -Math.PI / 2);
    chevron((cx + home[0]) / 2 + beltW * 0.35, cy, -Math.PI / 2);
    ctx.restore();
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    const { ctx } = this;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
    ctx.fill();
  }

  // A knit "V": two tilted ellipses with a soft highlight. Filled stitches
  // get a hairline in a shade of their own colour (--bobbin-stitch-outline-
  // shade): darker on the light panel so pale yarns read, lighter on the
  // dark panel so plum does.
  private stitch(x: number, y: number, s: number, colour: string, filled: boolean) {
    const { ctx } = this;
    for (const [side, rot] of [[-1, -0.5], [1, 0.5]] as const) {
      ctx.save();
      ctx.translate(x + side * s * 0.19, y);
      ctx.rotate(rot * 0.9);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.16, s * 0.42, 0, 0, Math.PI * 2);
      ctx.fillStyle = colour;
      ctx.fill();
      if (filled && colour.startsWith("#")) {
        ctx.strokeStyle = shade(colour, this.colours.outlineShade);
        ctx.lineWidth = Math.max(0.75, s * 0.03);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.ellipse(-s * 0.04, -s * 0.1, s * 0.06, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
      ctx.fill();
      ctx.restore();
    }
  }

  private spool(x: number, y: number, r: number, colour: string, n: number) {
    const { ctx } = this;
    ctx.fillStyle = SPOOL_WOOD;
    this.roundRect(x - r, y - r, r * 2, r * 0.38, r * 0.15);
    this.roundRect(x - r, y + r * 0.62, r * 2, r * 0.38, r * 0.15);
    ctx.fillStyle = colour;
    ctx.fillRect(x - r * 0.8, y - r * 0.62, r * 1.6, r * 1.24);
    ctx.strokeStyle = shade(colour, -0.18);
    ctx.lineWidth = Math.max(1, r * 0.08);
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.moveTo(x - r * 0.8, y + k * r * 0.22 - r * 0.08);
      ctx.lineTo(x + r * 0.8, y + k * r * 0.22 + r * 0.08);
      ctx.stroke();
    }
    ctx.font = `700 ${Math.round(r * 0.95)}px ${this.colours.font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = r * 0.28;
    ctx.strokeStyle = SPOOL_NUMBER_OUTLINE;
    ctx.strokeText(String(n), x, y + r * 0.04);
    ctx.fillStyle = SPOOL_NUMBER;
    ctx.fillText(String(n), x, y + r * 0.04);
  }
}
