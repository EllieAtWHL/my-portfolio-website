/** @jest-environment jsdom */
import type { Colour } from "../core/palette.ts";
import type { Grid } from "../core/rules.ts";
import { DIFFICULTIES } from "../gen/difficulty.ts";
import { GameSession } from "../game/session.ts";
import {
  LOST_OVERLAY,
  beltStatusText,
  hideOverlay,
  renderRack,
  renderSupply,
  showOverlay,
  wonOverlay,
} from "../render/ui.ts";
import { applyTheme, currentTheme, storedTheme, toggleTheme, watchSystemTheme, THEME_KEY } from "../theme.ts";

const grid = (...rows: string[]): Grid =>
  rows.map((r) => [...r].map((ch) => (ch === "." ? null : (ch as Colour))));

function session() {
  return new GameSession({
    code: "M-4K7P",
    grid: grid("abcd", "abcd", "abcd", "abcd"),
    cols: [
      [{ c: "a", n: 4 }, { c: "b", n: 2 }, { c: "b", n: 2 }, { c: "c", n: 4 }, { c: "d", n: 4 }],
      [],
      [],
    ],
    cfg: { ...DIFFICULTIES.M },
    source: "band",
  });
}

const handlers = () => ({ onSendColumn: jest.fn(), onSendRack: jest.fn() });

describe("supply columns", () => {
  it("makes only the front bobbin a labelled, tappable button", () => {
    const el = document.createElement("div");
    const h = handlers();
    renderSupply(el, session(), h);
    const col = el.querySelectorAll(".column")[0];
    const buttons = col.querySelectorAll("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0].getAttribute("aria-label")).toBe("Send red bobbin with 4");
    expect(buttons[0].disabled).toBe(false);
    for (const upcoming of [buttons[1], buttons[2]]) {
      expect(upcoming.disabled).toBe(true);
      expect(upcoming.tabIndex).toBe(-1);
      expect(upcoming.getAttribute("aria-hidden")).toBe("true");
    }
    expect(col.querySelector(".more")?.textContent).toBe("+2 more");
    buttons[0].click();
    expect(h.onSendColumn).toHaveBeenCalledWith(0, buttons[0]);
  });

  it("keeps the same buttons while the contents are unchanged, so a tap mid-tick isn't lost", () => {
    const el = document.createElement("div");
    const s = session();
    renderSupply(el, s, handlers());
    const before = el.querySelector("button");
    // Fill the belt: buttons disable in place rather than being rebuilt.
    s.state.belt.push(...[1, 2, 3, 4].map((i) => ({ c: "a" as Colour, n: 1, i, prev: i - 1 })));
    renderSupply(el, s, handlers());
    expect(el.querySelector("button")).toBe(before);
    expect(before?.disabled).toBe(true);
    s.state.belt = [];
    s.sendColumn(0);
    renderSupply(el, s, handlers());
    expect(el.querySelector("button")).not.toBe(before);
  });
});

describe("rack", () => {
  it("shows one slot per rack space, with filled slots tappable", () => {
    const el = document.createElement("div");
    const s = session();
    s.state.rack.push({ c: "c", n: 3, i: 16, prev: 15 });
    const h = handlers();
    renderRack(el, s, h);
    const slots = el.querySelectorAll<HTMLButtonElement>(".slot");
    expect(slots).toHaveLength(DIFFICULTIES.M.rack);
    expect(el.style.getPropertyValue("--rack-slots")).toBe(String(DIFFICULTIES.M.rack));
    expect(slots[0].getAttribute("aria-label")).toBe("Send yellow bobbin with 3 from the rack");
    expect(slots[1].disabled).toBe(true);
    expect(slots[1].getAttribute("aria-label")).toBe("Empty rack slot");
    slots[0].click();
    expect(h.onSendRack).toHaveBeenCalledWith(0, slots[0]);
  });
});

describe("status and overlays", () => {
  it("shows belt usage, or Finishing up once auto-finishing", () => {
    const s = session();
    expect(beltStatusText(s)).toBe("Belt 0 of 4");
    s.state.cols[0] = s.state.cols[0].slice(0, 2);
    expect(beltStatusText(s)).toBe("Finishing up");
  });

  it("shows a dialog, keeps the code on one line, and focuses the action", () => {
    document.body.innerHTML = `<div id="overlay" hidden><h2 id="overlayTitle"></h2><p id="overlayText"></p><button id="overlayBtn"></button></div>`;
    const root = document.getElementById("overlay")!;
    const onAction = jest.fn();
    showOverlay(root, { ...wonOverlay("M-4K7P", "Medium"), onAction });
    expect(root.hidden).toBe(false);
    expect(document.getElementById("overlayTitle")?.textContent).toBe("Pattern finished");
    expect(document.querySelector("#overlayText .nowrap")?.textContent).toBe("M-4K7P");
    expect(document.getElementById("overlayBtn")?.textContent).toBe("New medium puzzle");
    expect(document.activeElement?.id).toBe("overlayBtn");
    (document.activeElement as HTMLButtonElement).click();
    expect(onAction).toHaveBeenCalled();
    hideOverlay(root);
    expect(root.hidden).toBe(true);
    showOverlay(root, { ...LOST_OVERLAY, onAction });
    expect(document.querySelector("#overlayText .nowrap")).toBeNull();
  });
});

describe("theme (shared with the main site)", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn() });
  });

  it("uses the site's stored choice, else the system setting", () => {
    expect(currentTheme()).toBe("light");
    localStorage.setItem(THEME_KEY, "dark");
    expect(currentTheme()).toBe("dark");
    localStorage.setItem(THEME_KEY, "nonsense");
    expect(storedTheme()).toBeNull();
  });

  it("toggles the html class and remembers the choice under the site's key", () => {
    applyTheme("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(toggleTheme()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
    expect(toggleTheme()).toBe("light");
  });

  it("follows system changes only while the visitor hasn't chosen a theme", () => {
    let listener = () => {};
    const media = { matches: false, addEventListener: (_: string, fn: () => void) => (listener = fn) };
    window.matchMedia = jest.fn().mockReturnValue(media);
    const onChange = jest.fn();
    watchSystemTheme(onChange);
    media.matches = true;
    listener();
    expect(onChange).toHaveBeenLastCalledWith("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    localStorage.setItem(THEME_KEY, "light");
    media.matches = false;
    listener();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("still works when storage is blocked", () => {
    const spy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(storedTheme()).toBeNull();
    spy.mockRestore();
    const set = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    applyTheme("light");
    expect(toggleTheme()).toBe("dark");
    set.mockRestore();
  });
});
