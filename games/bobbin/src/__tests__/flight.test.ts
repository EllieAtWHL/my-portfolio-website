/** @jest-environment jsdom */
import type { BeltBobbin } from "../core/rules.ts";
import type { Colour } from "../core/palette.ts";
import { DIFFICULTIES } from "../gen/difficulty.ts";
import { GameSession } from "../game/session.ts";
import { FLIGHT_MS, FlightLayer, ease, lerpPoint } from "../render/flight.ts";
import { QUEUE_MS, renderRack, renderSupply } from "../render/ui.ts";

const bobbin = (c: Colour = "a", n = 4): BeltBobbin => ({ c, n, i: -1, prev: -1 });
const rect = (left: number, top: number, size: number) =>
  ({ left, top, width: size, height: size, right: left + size, bottom: top + size, x: left, y: top }) as DOMRect;

describe("flight maths", () => {
  it("eases out and clamps", () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(2)).toBe(1);
    expect(ease(-1)).toBe(0);
    expect(ease(0.5)).toBeGreaterThan(0.5); // quick start, gentle landing
  });

  it("interpolates position and size", () => {
    const p = lerpPoint({ x: 0, y: 0, size: 52 }, { x: 100, y: 200, size: 34 }, 1);
    expect(p).toEqual({ x: 100, y: 200, size: 34 });
  });
});

describe("FlightLayer", () => {
  it("flies a spool copy to wherever the bobbin is now, then removes it", () => {
    document.body.innerHTML = "";
    const layer = new FlightLayer(document.body);
    const b = bobbin();
    layer.launch(b, rect(100, 500, 52), 0);
    const el = document.querySelector<HTMLElement>(".flight")!;
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(layer.inFlight.has(b)).toBe(true);

    // The target moves (the bobbin is travelling the belt); the copy follows it.
    layer.update(FLIGHT_MS / 2, () => ({ x: 20, y: 300, size: 34 }));
    const mid = el.style.transform;
    layer.update(FLIGHT_MS * 0.9, () => ({ x: 20, y: 250, size: 34 }));
    expect(el.style.transform).not.toBe(mid);

    layer.update(FLIGHT_MS, () => ({ x: 20, y: 240, size: 34 }));
    expect(document.querySelector(".flight")).toBeNull();
    expect(layer.inFlight.has(b)).toBe(false);
  });

  it("keeps heading for the last known spot if the bobbin leaves the belt", () => {
    const layer = new FlightLayer(document.body);
    const b = bobbin();
    layer.launch(b, rect(0, 0, 40), 0);
    layer.update(100, () => ({ x: 50, y: 50, size: 34 }));
    expect(() => layer.update(200, () => null)).not.toThrow();
    layer.clear();
    expect(layer.inFlight.size).toBe(0);
    expect(document.querySelector(".flight")).toBeNull();
  });
});

describe("queue movement", () => {
  // jsdom has no layout or Web Animations: stub both, and always restore them.
  const animate = jest.fn();
  beforeEach(() => {
    animate.mockReset();
    (SVGElement.prototype as unknown as { animate: unknown }).animate = animate;
  });
  afterEach(() => {
    delete (SVGElement.prototype as unknown as { animate?: unknown }).animate;
    jest.restoreAllMocks();
  });

  function session() {
    const cols: BeltBobbin[][] = [[bobbin("a"), bobbin("a"), bobbin("b"), bobbin("c")], [], []];
    return new GameSession({
      code: "E-2222",
      grid: [["a", "a", "b", "c"].map((c) => c as Colour)],
      cols,
      cfg: { ...DIFFICULTIES.E, rack: 2 }, // not auto-finishing, so sends are allowed
      source: "band",
    });
  }

  it("slides the remaining spools up from where they were, even when the next one looks identical", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const s = session();
    const handlers = { onSendColumn: jest.fn(), onSendRack: jest.fn() };
    // Give each button a position from its index.
    jest.spyOn(HTMLButtonElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLButtonElement) {
      const i = [...(this.parentElement?.children ?? [])].indexOf(this);
      return rect(0, i * 50, i === 0 ? 52 : 40);
    });

    renderSupply(el, s, handlers, { animate: true });
    animate.mockClear(); // a fresh puzzle's spools fade in; only the send matters here
    s.sendColumn(0);
    renderSupply(el, s, handlers, { animate: true });

    // The new front "a" was second (y=50, 40px), now first (y=0, 52px): it
    // slides up and grows. "b" slides up behind it, and "c" (previously in
    // "+1 more") fades in.
    const first = animate.mock.calls[0];
    expect(first[0][0].transform).toBe("translate(-6px, 44px) scale(0.7692307692307693)");
    expect(first[1].duration).toBe(QUEUE_MS);
    expect(animate).toHaveBeenCalledTimes(3);
    expect(animate.mock.calls[2][0][0]).toEqual({ opacity: 0, transform: "translateY(12px)" });
  });

  it("doesn't animate when asked not to (reduced motion) or when the rack is unchanged", () => {
    const el = document.createElement("div");
    const s = session();
    const handlers = { onSendColumn: jest.fn(), onSendRack: jest.fn() };
    renderSupply(el, s, handlers, { animate: false });
    s.sendColumn(0);
    renderSupply(el, s, handlers, { animate: false });
    renderRack(el, s, handlers, { animate: true });
    renderRack(el, s, handlers, { animate: true });
    expect(animate).not.toHaveBeenCalled();
  });

  it("passes the tapped button to the send handler", () => {
    const el = document.createElement("div");
    const handlers = { onSendColumn: jest.fn(), onSendRack: jest.fn() };
    renderSupply(el, session(), handlers);
    const front = el.querySelector<HTMLButtonElement>(".spool")!;
    front.click();
    expect(handlers.onSendColumn).toHaveBeenCalledWith(0, front);
  });
});
