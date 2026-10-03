/** @jest-environment node */
import { atan2, hypot, sin } from "../core/math.ts";

describe("deterministic maths", () => {
  it("sin agrees with Math.sin across the generators' range", () => {
    for (let x = -30; x <= 30; x += 0.0137) expect(Math.abs(sin(x) - Math.sin(x))).toBeLessThan(1e-14);
  });

  it("sin hits the quadrant points", () => {
    expect(sin(0)).toBe(0);
    expect(sin(Math.PI / 2)).toBeCloseTo(1, 15);
    expect(sin(-Math.PI / 2)).toBeCloseTo(-1, 15);
  });

  it("atan2 agrees with Math.atan2 on every grid offset the rings use", () => {
    for (let dy = -6.5; dy <= 6.5; dy += 0.5) {
      for (let dx = -6.5; dx <= 6.5; dx += 0.5) {
        expect(Math.abs(atan2(dy, dx) - Math.atan2(dy, dx))).toBeLessThan(1e-14);
      }
    }
  });

  it("atan2 matches Math.atan2 on the axes and origin", () => {
    for (const [y, x] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) expect(atan2(y, x)).toBe(Math.atan2(y, x));
  });

  it("hypot agrees with Math.hypot", () => {
    expect(hypot(3, 4)).toBe(5);
    for (let x = -7; x <= 7; x += 0.37) expect(Math.abs(hypot(x, 2.5) - Math.hypot(x, 2.5))).toBeLessThan(1e-14);
  });
});
