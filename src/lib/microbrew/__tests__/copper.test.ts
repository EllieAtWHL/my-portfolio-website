import {
  getLegalTargets,
  getNeighbours,
  isLegalSwap,
  slotHeight,
  swapTokens,
  type Copper,
  type CopperSlot,
  type CopperToken,
} from '../copper';

// Test Coppers are written as columns (left to right) of slots (bottom to top),
// with Y/O/B = light/medium/dark malt, H = hops, . = empty.
const TOKENS: Record<string, CopperToken> = { Y: 'yellow', O: 'orange', B: 'brown', H: 'hops', '.': null };
const copperOf = (...columns: string[]): Copper => columns.map((column) => [...column].map((c) => TOKENS[c]));
const at = (column: number, slot: number): CopperSlot => ({ column, slot });

// Heights (slotHeight) for a 4-column Copper - columns 1 and 3 (indices 0, 2)
// are raised half a slot:
//
//   height:  7  6  5  4  3  2  1  0
//   col 0:   s3    s2    s1    s0
//   col 1:      s3    s2    s1    s0
//
// so (1,1) at height 2 neighbours (0,0)/(0,1) and (2,0)/(2,1), heights 1 and 3.
//
// SAMPLE's (1,1) reproduces the rulebook's Brew example (rules p.13): a light
// malt with medium up-left, light up-right, dark down-left and medium
// down-right, where "only the top left swap is legal".
const SAMPLE = copperOf(
  'BOYY', // col 0: (0,0)=B (1,1)'s down-left, (0,1)=O its up-left
  'YYOB', // col 1: (1,1)=Y is the example's centre token
  'OYBH', // col 2: (2,0)=O down-right, (2,1)=Y up-right, (2,3)=H
  'YOB.', // col 3: (3,3) is empty
);

describe('slotHeight', () => {
  it('raises columns 1 and 3 (and the side tank) by half a slot', () => {
    expect([0, 1, 2, 3, 4].map((column) => slotHeight(at(column, 0)))).toEqual([1, 0, 1, 0, 1]);
    expect(slotHeight(at(0, 3))).toBe(7);
    expect(slotHeight(at(1, 3))).toBe(6);
  });
});

describe('getNeighbours', () => {
  it('gives an interior slot its 4 diagonal neighbours', () => {
    expect(getNeighbours(SAMPLE, at(1, 1))).toEqual([at(0, 0), at(0, 1), at(2, 0), at(2, 1)]);
  });

  it('never includes same-column or horizontal slots', () => {
    const neighbours = getNeighbours(SAMPLE, at(1, 1));
    expect(neighbours.every((n) => Math.abs(n.column - 1) === 1)).toBe(true);
    expect(neighbours.every((n) => Math.abs(slotHeight(n) - slotHeight(at(1, 1))) === 1)).toBe(true);
    // Same height two columns away is not a neighbour either.
    expect(getNeighbours(SAMPLE, at(0, 0))).not.toContainEqual(at(2, 0));
  });

  it('gives corner slots only the neighbours that exist', () => {
    expect(getNeighbours(SAMPLE, at(0, 0))).toEqual([at(1, 0), at(1, 1)]); // bottom-left
    expect(getNeighbours(SAMPLE, at(0, 3))).toEqual([at(1, 3)]); // top-left
    expect(getNeighbours(SAMPLE, at(3, 0))).toEqual([at(2, 0)]); // bottom-right
  });

  it('gives edge slots 2 neighbours', () => {
    expect(getNeighbours(SAMPLE, at(1, 0))).toEqual([at(0, 0), at(2, 0)]); // bottom edge
    expect(getNeighbours(SAMPLE, at(3, 1))).toEqual([at(2, 0), at(2, 1)]); // right edge
  });

  it('joins column 4 to the side tank once there is a 5th column', () => {
    const upgraded = [...SAMPLE, [null, null, null, null]];
    expect(getNeighbours(upgraded, at(3, 1))).toEqual([at(2, 0), at(2, 1), at(4, 0), at(4, 1)]);
    expect(getNeighbours(upgraded, at(4, 0))).toEqual([at(3, 0), at(3, 1)]);
  });

  it('returns nothing for a slot outside the Copper', () => {
    expect(getNeighbours(SAMPLE, at(4, 0))).toEqual([]);
    expect(getNeighbours(SAMPLE, at(0, 4))).toEqual([]);
  });
});

describe('isLegalSwap', () => {
  it("matches the rulebook's example: only the up-left swap is legal", () => {
    expect(getLegalTargets(SAMPLE, at(1, 1))).toEqual([at(0, 1)]);
  });

  it('lets a malt move up only past a darker malt', () => {
    expect(isLegalSwap(SAMPLE, at(1, 1), at(0, 1))).toBe(true); // Y up past O
    expect(isLegalSwap(SAMPLE, at(0, 0), at(1, 1))).toBe(false); // B up past Y (lighter)
  });

  it('lets a malt move down only past a lighter malt', () => {
    expect(isLegalSwap(SAMPLE, at(0, 1), at(1, 1))).toBe(true); // O down past Y
    expect(isLegalSwap(SAMPLE, at(1, 1), at(0, 0))).toBe(false); // Y down past B (darker)
  });

  it('never swaps two malts of the same shade', () => {
    expect(isLegalSwap(SAMPLE, at(1, 1), at(2, 1))).toBe(false); // Y up past Y
    expect(isLegalSwap(SAMPLE, at(1, 3), at(2, 2))).toBe(false); // B down past B
  });

  it('lets a moving hop swap with any neighbouring token, up or down', () => {
    expect(isLegalSwap(SAMPLE, at(2, 3), at(1, 3))).toBe(true); // H down past B
    const hopBelow = copperOf('YYYY', 'HYYY', 'BBBB', 'YYYY');
    expect(isLegalSwap(hopBelow, at(1, 0), at(0, 0))).toBe(true); // H up past Y
    expect(isLegalSwap(hopBelow, at(1, 0), at(2, 0))).toBe(true); // H up past B
  });

  it('lets any malt swap with a neighbouring hop, even where no malt could', () => {
    // Nothing is darker than brown, so B could never move up past a malt.
    expect(isLegalSwap(SAMPLE, at(1, 3), at(2, 3))).toBe(true); // B up past H
  });

  it('never swaps with or from an empty slot', () => {
    expect(isLegalSwap(SAMPLE, at(2, 3), at(3, 3))).toBe(false); // H into empty
    expect(isLegalSwap(SAMPLE, at(3, 3), at(2, 3))).toBe(false); // empty can't move
  });

  it('rejects targets that are not diagonal neighbours', () => {
    // (1,2) is a darker malt directly above - legal if it were a neighbour.
    expect(isLegalSwap(SAMPLE, at(1, 1), at(1, 2))).toBe(false);
    expect(isLegalSwap(SAMPLE, at(1, 1), at(3, 1))).toBe(false); // two columns over
    expect(isLegalSwap(SAMPLE, at(1, 1), at(1, 1))).toBe(false); // itself
    expect(isLegalSwap(SAMPLE, at(1, 1), at(5, 0))).toBe(false); // off the board
  });
});

describe('a multi-step chain', () => {
  it('can keep moving the same dark malt down past lighter ones', () => {
    // B starts top of column 2 and zig-zags down between columns 1 and 2,
    // swapping past a lighter malt each time.
    let copper = copperOf('YYYY', 'YOOB', 'YYYY', 'YYYY');
    const path = [at(1, 3), at(0, 2), at(1, 2), at(0, 1), at(1, 1), at(0, 0), at(1, 0)];

    for (let step = 1; step < path.length; step++) {
      expect(isLegalSwap(copper, path[step - 1], path[step])).toBe(true);
      copper = swapTokens(copper, path[step - 1], path[step]);
    }

    // Each lighter malt it passed moved up one step along the path.
    expect(copper).toEqual(copperOf('YOOY', 'BYYY', 'YYYY', 'YYYY'));
    // At the bottom of column 2 it only has (lighter) malts above it: stuck.
    expect(getLegalTargets(copper, at(1, 0))).toEqual([]);
  });
});

describe('swapTokens', () => {
  it('swaps two slots without mutating the input', () => {
    const before = copperOf('YB', 'OH');
    const after = swapTokens(before, at(0, 1), at(1, 0));

    expect(after).toEqual(copperOf('YO', 'BH'));
    expect(before).toEqual(copperOf('YB', 'OH'));
  });
});
