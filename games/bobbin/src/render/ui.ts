// The DOM half of the screen: rack, supply columns, status line and the
// win/lose overlay. Every tappable bobbin is a real <button> with an
// aria-label; dimmed upcoming bobbins are hidden from assistive tech and
// can't be focused.

import { COLOUR_NAMES } from "../core/palette.ts";
import type { BeltBobbin } from "../core/rules.ts";
import type { GameSession } from "../game/session.ts";
import { spoolSVG } from "./spool.ts";

export interface UiHandlers {
  /** `button` is the tapped button, so the send can animate from it. */
  onSendColumn: (k: number, button: HTMLButtonElement) => void;
  onSendRack: (k: number, button: HTMLButtonElement) => void;
}

export interface RenderOptions {
  /** Slide bobbins to their new places when the queue moves (off under reduced motion). */
  animate?: boolean;
}

// ---------- queue movement (FLIP) ----------
//
// When a column or the rack is rebuilt, each bobbin that's still visible
// slides (and grows or shrinks) from where it was to where it now is, and
// newly revealed bobbins fade in. Only the spool graphic inside each button
// moves: the button (the tap target) is already fixed in its final place, so
// a quick second tap on the front slot can't fall into a gap mid-slide, and
// nothing is rebuilt mid-tap (see `reuse` below).

export const QUEUE_MS = 220;
const bobbinOf = new WeakMap<Element, BeltBobbin>();

interface Snapshot {
  rect: DOMRect;
  opacity: string;
}

function snapshot(el: HTMLElement): Map<BeltBobbin, Snapshot> {
  const before = new Map<BeltBobbin, Snapshot>();
  el.querySelectorAll("button").forEach((btn) => {
    const b = bobbinOf.get(btn);
    if (b) before.set(b, { rect: btn.getBoundingClientRect(), opacity: getComputedStyle(btn).opacity });
  });
  return before;
}

function slide(el: HTMLElement, before: Map<BeltBobbin, Snapshot>) {
  el.querySelectorAll<HTMLButtonElement>("button").forEach((btn) => {
    const b = bobbinOf.get(btn);
    const art = btn.firstElementChild as SVGElement | null;
    if (!b || !art || typeof art.animate !== "function") return;
    const now = btn.getBoundingClientRect();
    if (!now.width) return;
    const old = before.get(b);
    if (!old?.rect.width) {
      // Newly revealed (e.g. the next bobbin up from "+N more").
      art.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], {
        duration: QUEUE_MS,
        easing: "ease-out",
      });
      return;
    }
    const dx = old.rect.left + old.rect.width / 2 - (now.left + now.width / 2);
    const dy = old.rect.top + old.rect.height / 2 - (now.top + now.height / 2);
    const scale = old.rect.width / now.width;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(scale - 1) < 0.01) return;
    // The button's own (final) opacity still applies, so start the art at
    // the ratio that makes it look as faded as it was.
    const fromOpacity = Math.min(1, Number(old.opacity) / (Number(getComputedStyle(btn).opacity) || 1));
    art.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: fromOpacity },
        { transform: "none", opacity: 1 },
      ],
      { duration: QUEUE_MS, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
  });
}

/** Bobbins shown per supply column: the tappable front plus two dimmed. */
const VISIBLE_PER_COLUMN = 3;

export function beltStatusText(session: GameSession): string {
  if (session.phase === "finishing") return "Finishing up";
  return `Belt ${session.beltCount} of ${session.puzzle.cfg.belt}`;
}

// Rebuilding a button mid-tap loses the tap (pointerdown lands on the old
// element, pointerup on the new one), and the belt ticks every 110 ms. So the
// rack and supply are only rebuilt when what they show changes; otherwise
// just the enabled state is updated in place.
function reuse(el: HTMLElement, key: string, enabled: boolean): boolean {
  if (el.dataset.key !== key) {
    el.dataset.key = key;
    return false;
  }
  el.querySelectorAll<HTMLButtonElement>("[data-sendable]").forEach((b) => (b.disabled = !enabled));
  return true;
}

const bobbinKey = (b: { c: string; n: number }) => b.c + b.n;

export function renderRack(el: HTMLElement, session: GameSession, handlers: UiHandlers, options: RenderOptions = {}): void {
  const s = session.state;
  const enabled = session.canSend;
  if (reuse(el, `${s.rackSize}|${s.rack.map(bobbinKey).join(",")}`, enabled)) return;
  const before = options.animate ? snapshot(el) : null;
  el.style.setProperty("--rack-slots", String(s.rackSize));
  el.replaceChildren();
  for (let i = 0; i < s.rackSize; i++) {
    const b = s.rack[i];
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "slot";
    if (b) {
      slot.classList.add("filled");
      slot.innerHTML = spoolSVG(b.c, b.n, 40);
      slot.disabled = !enabled;
      slot.dataset.sendable = "";
      slot.setAttribute("aria-label", `Send ${COLOUR_NAMES[b.c]} bobbin with ${b.n} from the rack`);
      bobbinOf.set(slot, b);
      slot.addEventListener("click", () => handlers.onSendRack(i, slot));
    } else {
      slot.disabled = true;
      slot.setAttribute("aria-label", "Empty rack slot");
    }
    el.appendChild(slot);
  }
  if (before) slide(el, before);
}

export function renderSupply(el: HTMLElement, session: GameSession, handlers: UiHandlers, options: RenderOptions = {}): void {
  const enabled = session.canSend;
  const key = session.state.cols.map((col) => col.slice(0, VISIBLE_PER_COLUMN).map(bobbinKey).join(",") + "+" + col.length).join("|");
  if (reuse(el, key, enabled)) return;
  const before = options.animate ? snapshot(el) : null;
  el.replaceChildren();
  session.state.cols.forEach((col, k) => {
    const column = document.createElement("div");
    column.className = "column";
    col.slice(0, VISIBLE_PER_COLUMN).forEach((b, j) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "spool";
      btn.innerHTML = spoolSVG(b.c, b.n, j === 0 ? 52 : 40);
      bobbinOf.set(btn, b);
      if (j === 0) {
        btn.disabled = !enabled;
        btn.dataset.sendable = "";
        btn.setAttribute("aria-label", `Send ${COLOUR_NAMES[b.c]} bobbin with ${b.n}`);
        btn.addEventListener("click", () => handlers.onSendColumn(k, btn));
      } else {
        // Upcoming: visible for planning, but not interactive.
        btn.classList.add("upcoming", `upcoming-${j}`);
        btn.disabled = true;
        btn.tabIndex = -1;
        btn.setAttribute("aria-hidden", "true");
      }
      column.appendChild(btn);
    });
    if (col.length > VISIBLE_PER_COLUMN) {
      const more = document.createElement("span");
      more.className = "more";
      more.textContent = `+${col.length - VISIBLE_PER_COLUMN} more`;
      column.appendChild(more);
    }
    if (!col.length) {
      column.setAttribute("aria-label", "Empty column");
      column.setAttribute("role", "group");
    }
    el.appendChild(column);
  });
  if (before) slide(el, before);
}

export interface OverlayContent {
  title: string;
  text: string;
  /** Shown after the text, kept on one line (codes mustn't break at the hyphen). */
  code?: string;
  action: string;
  onAction: () => void;
}

export function showOverlay(root: HTMLElement, content: OverlayContent): void {
  root.querySelector<HTMLElement>("#overlayTitle")!.textContent = content.title;
  const text = root.querySelector<HTMLElement>("#overlayText")!;
  text.textContent = content.text;
  if (content.code) {
    const code = document.createElement("strong");
    code.className = "nowrap";
    code.textContent = content.code;
    text.append(" ", code, ".");
  }
  const btn = root.querySelector<HTMLButtonElement>("#overlayBtn")!;
  btn.textContent = content.action;
  btn.onclick = content.onAction;
  root.hidden = false;
  btn.focus({ preventScroll: true });
}

export function hideOverlay(root: HTMLElement): void {
  root.hidden = true;
}

export const LOST_OVERLAY = {
  title: "The rack is full",
  text: "A bobbin came round with yarn left and had nowhere to wait. Try sending colours that can reach the edge.",
  action: "Try again",
};

export function wonOverlay(code: string, label: string) {
  return {
    title: "Pattern finished",
    text: "Every stitch collected. To play this one again, use code",
    code,
    action: `New ${label.toLowerCase()} puzzle`,
  };
}
