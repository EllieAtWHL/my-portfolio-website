// Entry point: wires the session, clock, renderer and DOM together.
import "@fontsource/nokora/latin-400.css";
import "@fontsource/nokora/latin-600.css";
import "@fontsource/nokora/latin-700.css";
import "./styles.css";

import { INVALID_CODE_MESSAGE, parseCode, randomCode } from "./core/codes.ts";
import type { Difficulty } from "./gen/difficulty.ts";
import { PuzzleSource } from "./gen/client.ts";
import type { Puzzle } from "./gen/generate.ts";
import { FixedClock } from "./game/clock.ts";
import { GameSession } from "./game/session.ts";
import { BoardRenderer, readBoardColours } from "./render/canvas.ts";
import {
  LOST_OVERLAY,
  beltStatusText,
  hideOverlay,
  renderRack,
  renderSupply,
  showOverlay,
  wonOverlay,
} from "./render/ui.ts";
import { currentTheme, toggleTheme, watchSystemTheme, type Theme } from "./theme.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const els = {
  title: $("title"),
  levelName: $("levelName"),
  code: $("code"),
  copyBtn: $<HTMLButtonElement>("copyBtn"),
  restartBtn: $<HTMLButtonElement>("restartBtn"),
  newBtn: $<HTMLButtonElement>("newBtn"),
  themeBtn: $<HTMLButtonElement>("themeBtn"),
  board: $<HTMLCanvasElement>("board"),
  overlay: $("overlay"),
  hint: $("hint"),
  rack: $("rack"),
  beltStatus: $("beltStatus"),
  supply: $("supply"),
  codeForm: $<HTMLFormElement>("codeForm"),
  codeInput: $<HTMLInputElement>("codeInput"),
  codeMsg: $("codeMsg"),
};

const puzzles = new PuzzleSource(
  () => new Worker(new URL("./gen/worker.ts", import.meta.url), { type: "module" }),
);
const clock = new FixedClock();
const renderer = new BoardRenderer(els.board, readBoardColours());
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
renderer.reduceMotion = reduceMotion.matches;
reduceMotion.addEventListener("change", () => (renderer.reduceMotion = reduceMotion.matches));

let session: GameSession | null = null;
let currentCode = "";
let started = false; // first bobbin sent this visit: hides the hint
let uiDirty = true;
let loadToken = 0;

const handlers = {
  onSendColumn: (k: number) => send(() => session!.sendColumn(k)),
  onSendRack: (k: number) => send(() => session!.sendRack(k)),
};

function send(action: () => boolean) {
  if (!session || !action()) return;
  if (!started) {
    started = true;
    els.hint.hidden = true;
  }
  uiDirty = true;
}

// ---------- loading puzzles ----------

async function load(code: string) {
  const token = ++loadToken;
  currentCode = code;
  const p = parseCode(code)!;
  els.title.textContent = "Knitting…";
  els.code.textContent = p.code;
  setDifficultyButtons(p.difficulty);
  let puzzle: Puzzle;
  try {
    puzzle = await puzzles.get(p.code);
  } catch {
    els.title.textContent = "Bobbin";
    els.codeMsg.textContent = "Couldn't build that puzzle. Try another code.";
    return;
  }
  if (token !== loadToken) return; // a newer request superseded this one
  start(puzzle);
}

function start(puzzle: Puzzle) {
  session = new GameSession(puzzle);
  els.title.textContent = "Bobbin";
  els.levelName.textContent = `${puzzle.cfg.label} puzzle`;
  els.code.textContent = puzzle.code;
  els.hint.hidden = started;
  hideOverlay(els.overlay);
  renderer.layout(session.state.W, session.state.H);
  uiDirty = true;
}

function newPuzzle(d?: Difficulty) {
  const difficulty = d ?? (parseCode(currentCode)?.difficulty || "E");
  void load(randomCode(difficulty));
}

function setDifficultyButtons(d: Difficulty) {
  document.querySelectorAll<HTMLButtonElement>("[data-difficulty]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.difficulty === d));
  });
}

// ---------- the loop ----------

function renderUi() {
  if (!session) return;
  uiDirty = false;
  renderRack(els.rack, session, handlers);
  renderSupply(els.supply, session, handlers);
  els.beltStatus.textContent = beltStatusText(session);
}

function frame(now: number) {
  if (session) {
    const { ticks, alpha } = clock.frame(now);
    for (const t of ticks) {
      if (session.state.status !== "play") break;
      const events = session.tick(t);
      if (events.length) uiDirty = true;
      for (const e of events) {
        if (e.type === "lost") onLost();
        if (e.type === "won") onWon();
      }
    }
    try {
      renderer.draw(session, now, alpha, now);
    } catch (error) {
      // A drawing bug must never stop the game loop.
      console.warn(error);
    }
    if (uiDirty) renderUi();
  }
  requestAnimationFrame(frame);
}

function onLost() {
  showOverlay(els.overlay, { ...LOST_OVERLAY, onAction: () => restart() });
}

function onWon() {
  const s = session!;
  setTimeout(() => {
    if (session !== s) return;
    showOverlay(els.overlay, { ...wonOverlay(s.puzzle.code, s.puzzle.cfg.label), onAction: () => newPuzzle() });
  }, 500);
}

function restart() {
  if (session) start(session.puzzle); // cached: never regenerates
}

// ---------- controls ----------

els.restartBtn.addEventListener("click", restart);
els.newBtn.addEventListener("click", () => newPuzzle());
document.querySelectorAll<HTMLButtonElement>("[data-difficulty]").forEach((b) => {
  b.addEventListener("click", () => newPuzzle(b.dataset.difficulty as Difficulty));
});

els.copyBtn.addEventListener("click", async () => {
  const code = session?.puzzle.code ?? "";
  try {
    await navigator.clipboard.writeText(code);
    els.copyBtn.textContent = "Copied";
  } catch {
    els.copyBtn.textContent = code;
  }
  setTimeout(() => (els.copyBtn.textContent = "Copy"), 1500);
});

els.codeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const p = parseCode(els.codeInput.value);
  if (!p) {
    els.codeMsg.textContent = INVALID_CODE_MESSAGE;
    return;
  }
  els.codeMsg.textContent = "";
  els.codeInput.value = "";
  void load(p.code);
});

function onThemeChange(theme: Theme) {
  els.themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  renderer.colours = readBoardColours();
}
els.themeBtn.addEventListener("click", () => onThemeChange(toggleTheme()));
watchSystemTheme(onThemeChange);
onThemeChange(currentTheme());

window.addEventListener("resize", () => session && renderer.layout(session.state.W, session.state.H));
document.addEventListener("visibilitychange", () => clock.reset(performance.now()));
// Canvas text needs Nokora loaded before the first spool numbers are drawn.
void document.fonts?.ready.then(() => (renderer.colours = readBoardColours()));

newPuzzle("E");
requestAnimationFrame(frame);
