/** @jest-environment node */
import { FixedClock } from "../game/clock.ts";
import { GameSession, POP_MS, THREAD_MS } from "../game/session.ts";
import type { Colour } from "../core/palette.ts";
import type { Bobbin, Grid } from "../core/rules.ts";
import { DIFFICULTIES } from "../gen/difficulty.ts";
import type { Puzzle } from "../gen/generate.ts";

const grid = (...rows: string[]): Grid =>
  rows.map((r) => [...r].map((ch) => (ch === "." ? null : (ch as Colour))));
const puzzle = (g: Grid, cols: Bobbin[][], rack = 3, belt = 4): Puzzle => ({
  code: "E-2222",
  grid: g,
  cols,
  cfg: { ...DIFFICULTIES.E, rack, belt },
  source: "band",
});

function run(session: GameSession, ticks: number, t0 = 0) {
  const events = [];
  for (let t = 1; t <= ticks && session.state.status === "play"; t++) events.push(...session.tick(t0 + t * 110));
  return events;
}

describe("GameSession", () => {
  it("doesn't mutate the puzzle, so Restart can reuse it", () => {
    const p = puzzle(grid("aa", "aa"), [[{ c: "a", n: 4 }], [], []]);
    const s = new GameSession(p);
    s.sendColumn(0);
    run(s, 20);
    expect(s.phase).toBe("won");
    expect(p.grid).toEqual(grid("aa", "aa"));
    expect(p.cols[0]).toEqual([{ c: "a", n: 4 }]);
    expect(new GameSession(p).state.left).toBe(4);
  });

  it("reports play, finishing (input locked) and the end states", () => {
    const many = Array.from({ length: 3 }, () => [{ c: "a" as Colour, n: 1 }, { c: "a" as Colour, n: 1 }]);
    const s = new GameSession(puzzle(grid("aaa", "aaa"), many, 3, 4));
    expect(s.phase).toBe("play");
    expect(s.canSend).toBe(true);
    s.sendColumn(0);
    s.sendColumn(1);
    s.sendColumn(2);
    // 3 in supply + 3 pending = 6 > rack 3: still playing.
    expect(s.phase).toBe("play");
    s.sendColumn(0);
    // 2 in supply + 4 waiting/on belt = 6, but belt capacity is now reached.
    expect(s.canSend).toBe(false);
    expect(s.beltCount).toBe(4);
    run(s, 60);
    expect(s.phase).toBe("won");
  });

  it("records a thread effect per collected stitch and a pop when a bobbin empties", () => {
    const s = new GameSession(puzzle(grid("ab", "bb"), [[{ c: "a", n: 1 }], [{ c: "b", n: 3 }], []], 1, 4));
    s.sendColumn(0);
    run(s, 10);
    const types = s.effects.map((e) => e.type);
    expect(types).toContain("thread");
    expect(types).toContain("pop");
    const thread = s.effects.find((e) => e.type === "thread")!;
    expect(thread).toMatchObject({ x: 0, y: 0, colour: "#EF5B5B" });
  });

  it("drops effects once their animation is over", () => {
    const s = new GameSession(puzzle(grid("a"), [[{ c: "a", n: 1 }], [], []]));
    s.sendColumn(0);
    run(s, 2);
    expect(s.liveEffects(220).length).toBeGreaterThan(0);
    expect(s.liveEffects(220 + Math.max(THREAD_MS, POP_MS) + 1)).toHaveLength(0);
  });

  it("freezes on a loss", () => {
    const s = new GameSession(puzzle(grid("bbb", "bab", "bbb"), [[{ c: "a", n: 1 }], [{ c: "b", n: 4 }], [{ c: "b", n: 4 }]], 0, 4));
    s.sendColumn(0);
    const events = run(s, 30);
    expect(events.some((e) => e.type === "lost")).toBe(true);
    expect(s.phase).toBe("lost");
    expect(s.canSend).toBe(false);
    expect(s.tick(99999)).toEqual([]);
  });
});

describe("FixedClock", () => {
  it("runs whole ticks and interpolates between them", () => {
    const c = new FixedClock(100);
    expect(c.frame(1000)).toEqual({ ticks: [], alpha: 0 });
    expect(c.frame(1050)).toEqual({ ticks: [], alpha: 0.5 });
    expect(c.frame(1230)).toEqual({ ticks: [1100, 1200], alpha: expect.closeTo(0.3) });
  });

  it("resyncs after a long stall instead of fast-forwarding", () => {
    const c = new FixedClock(100);
    c.frame(0);
    expect(c.frame(60_000).ticks).toHaveLength(1);
  });

  it("can be reset when the page becomes visible again", () => {
    const c = new FixedClock(100);
    c.frame(0);
    c.reset(400);
    expect(c.frame(450).ticks).toHaveLength(0);
  });
});
