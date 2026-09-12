import { describe, it, expect } from '@jest/globals';
import { compareNullableNumbers } from '../sort';

describe('compareNullableNumbers', () => {
  it('treats two unset values as equal', () => {
    expect(compareNullableNumbers(null, undefined)).toBe(0);
    expect(compareNullableNumbers(null, null)).toBe(0);
  });

  it('sorts an unset value after a set one, ascending', () => {
    expect(compareNullableNumbers(null, 5, 'asc')).toBeGreaterThan(0);
    expect(compareNullableNumbers(5, null, 'asc')).toBeLessThan(0);
  });

  it('keeps an unset value last even when direction is descending', () => {
    expect(compareNullableNumbers(null, 5, 'desc')).toBeGreaterThan(0);
    expect(compareNullableNumbers(5, null, 'desc')).toBeLessThan(0);
  });

  it('compares two set values ascending by default', () => {
    expect(compareNullableNumbers(1, 2)).toBeLessThan(0);
    expect(compareNullableNumbers(2, 1)).toBeGreaterThan(0);
    expect(compareNullableNumbers(2, 2)).toBe(0);
  });

  it('reverses the comparison of two set values when descending', () => {
    expect(compareNullableNumbers(1, 2, 'desc')).toBeGreaterThan(0);
    expect(compareNullableNumbers(2, 1, 'desc')).toBeLessThan(0);
  });
});
