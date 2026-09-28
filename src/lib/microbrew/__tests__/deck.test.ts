import { deal, shuffle } from '../deck';

const sorted = (values: number[]) => [...values].sort((a, b) => a - b);

describe('shuffle', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a permutation of the input', () => {
    const input = Array.from({ length: 50 }, (_, i) => i);
    const result = shuffle(input);

    expect(result).toHaveLength(input.length);
    expect(sorted(result)).toEqual(input);
  });

  it('keeps duplicate entries (e.g. duplicate recipe cards or malt tokens)', () => {
    const input = ['yellow', 'yellow', 'orange', 'brown', 'brown', 'brown'];
    const result = shuffle(input);

    expect([...result].sort()).toEqual([...input].sort());
  });

  it('does not mutate the input array', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const input = [1, 2, 3, 4];
    const result = shuffle(input);

    expect(input).toEqual([1, 2, 3, 4]);
    expect(result).not.toBe(input);
  });

  it('handles empty and single-item arrays', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(['only'])).toEqual(['only']);
  });
});

describe('deal', () => {
  it('takes cards from the front and returns the rest', () => {
    expect(deal(['a', 'b', 'c', 'd'], 3)).toEqual({ dealt: ['a', 'b', 'c'], remaining: ['d'] });
  });

  it('deals zero cards as a no-op', () => {
    expect(deal(['a', 'b'], 0)).toEqual({ dealt: [], remaining: ['a', 'b'] });
  });

  it('does not mutate the input deck', () => {
    const deck = ['a', 'b', 'c'];
    deal(deck, 2);
    expect(deck).toEqual(['a', 'b', 'c']);
  });

  it('throws rather than dealing short', () => {
    expect(() => deal(['a', 'b'], 3)).toThrow(RangeError);
  });

  it('rejects negative or fractional counts', () => {
    expect(() => deal(['a', 'b'], -1)).toThrow(RangeError);
    expect(() => deal(['a', 'b'], 1.5)).toThrow(RangeError);
  });
});
