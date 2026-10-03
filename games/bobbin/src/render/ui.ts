// The DOM half of the screen: rack, supply columns, status line and the
// win/lose overlay. Every tappable bobbin is a real <button> with an
// aria-label; dimmed upcoming bobbins are hidden from assistive tech and
// can't be focused.

import { COLOUR_NAMES } from "../core/palette.ts";
import type { GameSession } from "../game/session.ts";
import { spoolSVG } from "./spool.ts";

export interface UiHandlers {
  onSendColumn: (k: number) => void;
  onSendRack: (k: number) => void;
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

export function renderRack(el: HTMLElement, session: GameSession, handlers: UiHandlers): void {
  const s = session.state;
  const enabled = session.canSend;
  if (reuse(el, `${s.rackSize}|${s.rack.map(bobbinKey).join(",")}`, enabled)) return;
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
      slot.addEventListener("click", () => handlers.onSendRack(i));
    } else {
      slot.disabled = true;
      slot.setAttribute("aria-label", "Empty rack slot");
    }
    el.appendChild(slot);
  }
}

export function renderSupply(el: HTMLElement, session: GameSession, handlers: UiHandlers): void {
  const enabled = session.canSend;
  const key = session.state.cols.map((col) => col.slice(0, VISIBLE_PER_COLUMN).map(bobbinKey).join(",") + "+" + col.length).join("|");
  if (reuse(el, key, enabled)) return;
  el.replaceChildren();
  session.state.cols.forEach((col, k) => {
    const column = document.createElement("div");
    column.className = "column";
    col.slice(0, VISIBLE_PER_COLUMN).forEach((b, j) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "spool";
      btn.innerHTML = spoolSVG(b.c, b.n, j === 0 ? 52 : 40);
      if (j === 0) {
        btn.disabled = !enabled;
        btn.dataset.sendable = "";
        btn.setAttribute("aria-label", `Send ${COLOUR_NAMES[b.c]} bobbin with ${b.n}`);
        btn.addEventListener("click", () => handlers.onSendColumn(k));
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
