/** @jest-environment node */
import type { Colour } from "../core/palette.ts";
import {
  advance,
  beltLength,
  canSend,
  createPlayState,
  entryOpen,
  exposed,
  feed,
  isAutoFinishing,
  lineFirst,
  sendFromColumn,
  sendFromRack,
  step,
  type Bobbin,
  type Grid,
  type PlayState,
} from "../core/rules.ts";

// "ab." rows -> grid; "." is an empty cell.
const grid = (...rows: string[]): Grid =>
  rows.map((r) => [...r].map((ch) => (ch === "." ? null : (ch as Colour))));
const bob = (c: Colour, n: number): Bobbin => ({ c, n });

function runUntilDone(s: PlayState, maxTicks = 500) {
  for (let t = 0; t < maxTicks && s.status === "play"; t++) step(s);
}

describe("belt geometry", () => {
  // W=3, H=2: L = 10. Every cell is distinct so we can see which one each position sees.
  const g = grid("abc", "def");

  it("has one position per row/column edge", () => {
    expect(beltLength(g)).toBe(10);
  });

  it("enters bottom-left and runs clockwise: up the left, across the top, down the right, back along the bottom", () => {
    const seen = Array.from({ length: 10 }, (_, i) => {
      const p = lineFirst(g, i)!;
      return g[p[1]][p[0]];
    });
    expect(seen.join("")).toBe(
      "da" + // left side, bottom row first, looking right
        "abc" + // top, left to right, looking down
        "cf" + // right side, top row first, looking left
        "fed", // bottom, right to left, looking up
    );
  });

  it("looks past empty cells to the first stitch in the line", () => {
    expect(lineFirst(grid("..a", "..."), 1)).toEqual([2, 0]);
    expect(lineFirst(grid("...", "..."), 1)).toBeNull();
  });

  it("lists each exposed stitch once, in belt order", () => {
    expect(exposed(grid("abc", "def", "ghi")).map(([x, y]) => x + "," + y)).not.toContain("1,1");
    expect(exposed(g)).toHaveLength(6);
  });
});

describe("collecting stitches", () => {
  it("collects only when the first stitch in line is the bobbin's colour", () => {
    // The 'a' in the middle is hidden behind 'b's on every side.
    const s = createPlayState(grid("bbb", "bab", "bbb"), [[bob("a", 1)], [], []], 3, 4);
    sendFromColumn(s, 0);
    runUntilDone(s);
    expect(s.grid[1][1]).toBe("a");
    expect(s.left).toBe(9);
  });

  it("collects at most one stitch per tick and pops when empty", () => {
    const s = createPlayState(grid("aa", "aa"), [[bob("a", 4)], [], []], 3, 4);
    sendFromColumn(s, 0);
    step(s); // enters at the corner
    const collected: number[] = [];
    for (let t = 0; t < 8 && s.status === "play"; t++) {
      collected.push(step(s).filter((e) => e.type === "collect").length);
    }
    expect(Math.max(...collected)).toBe(1);
    expect(s.status).toBe("won");
    expect(s.belt).toHaveLength(0);
  });

  it("racks a bobbin that finishes its loop with capacity left", () => {
    // The 'b' bobbin can reach 3 of the 'b's on one loop (the 'a' blocks
    // nothing it needs), so it comes round with 2 left and goes to the rack.
    const s = createPlayState(grid("ba", "bb"), [[bob("b", 5)], [bob("a", 1)], []], 1, 4); // rack 1: not auto-finishing
    sendFromColumn(s, 0);
    const events = [];
    for (let t = 0; t < 12 && !s.rack.length; t++) events.push(...step(s));
    expect(events.filter((e) => e.type === "collect")).toHaveLength(3);
    expect(events.some((e) => e.type === "rack")).toBe(true);
    expect(s.rack.map((b) => [b.c, b.n])).toEqual([["b", 2]]);
    expect(s.status).toBe("play");
  });
});

describe("losing", () => {
  it("loses when a bobbin with capacity left comes round to a full rack, and freezes it on the belt", () => {
    // 'a' is buried, so an 'a' bobbin can never collect anything.
    const s = createPlayState(grid("bbb", "bab", "bbb"), [[bob("a", 1)], [bob("b", 8)], []], 1, 4);
    s.rack.push({ c: "b", n: 8, i: 12, prev: 11 }); // rack already full
    s.cols[1] = [];
    sendFromColumn(s, 0);
    const events = [];
    for (let t = 0; t < 20 && s.status === "play"; t++) events.push(...step(s));
    expect(s.status).toBe("lost");
    expect(events.filter((e) => e.type === "lost")).toHaveLength(1);
    expect(s.belt).toHaveLength(1);
    const frozen = { ...s.belt[0] };
    step(s);
    expect(s.belt[0]).toEqual(frozen);
  });
});

describe("entry and sending", () => {
  it("only lets a bobbin enter once the corner is clear", () => {
    const s = createPlayState(grid("aaaa", "aaaa", "aaaa", "aaaa"), [[bob("a", 4), bob("a", 4)], [bob("a", 4)], [bob("a", 4)]], 3, 4);
    // Plenty of bobbins left, so this isn't auto-finishing.
    expect(sendFromColumn(s, 0)).toBe(true);
    expect(sendFromColumn(s, 0)).toBe(true);
    step(s);
    expect(s.belt).toHaveLength(1); // second waits: first is still at the corner
    expect(entryOpen(s)).toBe(false);
    step(s);
    expect(s.belt).toHaveLength(1);
    step(s);
    expect(s.belt).toHaveLength(2);
  });

  it("refuses sends beyond belt capacity and from empty slots", () => {
    const s = createPlayState(grid("aaaa", "aaaa", "aaaa", "aaaa"), [[bob("a", 4), bob("a", 4)], [bob("a", 4)], [bob("a", 4)]], 3, 2);
    expect(sendFromColumn(s, 0)).toBe(true);
    expect(sendFromColumn(s, 1)).toBe(true);
    expect(canSend(s)).toBe(false);
    expect(sendFromColumn(s, 2)).toBe(false);
    expect(sendFromRack(s, 0)).toBe(false);
  });

  it("sends from any rack slot", () => {
    const s = createPlayState(grid("ab", "ab"), [[bob("a", 2)], [bob("b", 1)], [bob("b", 1)]], 3, 4);
    s.rack.push({ c: "a", n: 1, i: 8, prev: 7 }, { c: "b", n: 1, i: 8, prev: 7 });
    s.cols[0] = [];
    s.cols[1] = [bob("b", 1), bob("b", 1)].map((b) => ({ ...b, i: -1, prev: -1 }));
    expect(sendFromRack(s, 1)).toBe(true);
    expect(s.rack.map((b) => b.c)).toEqual(["a"]);
    expect(s.pending.map((b) => b.c)).toEqual(["b"]);
  });
});

describe("auto-finish", () => {
  it("counts bobbins already on the belt (the prototype's playtest bug)", () => {
    const s = createPlayState(grid("aaaa", "aaaa", "aaaa", "aaaa"), [[bob("a", 4)], [], []], 2, 4);
    s.belt.push({ c: "a", n: 4, i: 5, prev: 4 }, { c: "a", n: 4, i: 9, prev: 8 });
    // supply 1 + belt 2 = 3 > rack 2: losing is still possible, so play on.
    expect(isAutoFinishing(s)).toBe(false);
    expect(canSend(s)).toBe(true);
    s.belt.pop();
    expect(isAutoFinishing(s)).toBe(true);
  });

  it("locks input and feeds pending, then the rack, then the columns", () => {
    const s = createPlayState(grid("ab", "ba"), [[], [bob("b", 2)], []], 3, 4);
    s.rack.push({ c: "a", n: 2, i: 8, prev: 7 });
    expect(isAutoFinishing(s)).toBe(true);
    expect(canSend(s)).toBe(false);
    expect(sendFromColumn(s, 1)).toBe(false);
    const entered: string[] = [];
    for (let t = 0; t < 100 && s.status === "play"; t++) {
      for (const e of feed(s, advance(s))) if (e.type === "enter") entered.push(e.bobbin.c);
    }
    expect(entered).toEqual(["a", "b"]);
    expect(s.status).toBe("won");
  });
});
