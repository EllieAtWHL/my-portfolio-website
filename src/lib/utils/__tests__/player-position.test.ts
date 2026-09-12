import { describe, it, expect } from '@jest/globals';
import { getPositionSortOrder } from '../player-position';

describe('getPositionSortOrder', () => {
  it('returns null for an empty, null, or undefined position', () => {
    expect(getPositionSortOrder('')).toBeNull();
    expect(getPositionSortOrder(null)).toBeNull();
    expect(getPositionSortOrder(undefined)).toBeNull();
  });

  it('returns null for a position that matches no known keyword', () => {
    expect(getPositionSortOrder('Utility Player')).toBeNull();
  });

  it('resolves canonical position labels to Goalkeeper < Defender < Midfielder < Forward', () => {
    expect(getPositionSortOrder('Goalkeeper')).toBe(0);
    expect(getPositionSortOrder('Defender')).toBe(1);
    expect(getPositionSortOrder('Midfielder')).toBe(2);
    expect(getPositionSortOrder('Forward')).toBe(3);
  });

  it('is case-insensitive', () => {
    expect(getPositionSortOrder('goalkeeper')).toBe(0);
    expect(getPositionSortOrder('DEFENDER')).toBe(1);
  });

  it('resolves abbreviations and compound labels via exact match', () => {
    expect(getPositionSortOrder('GK')).toBe(0);
    expect(getPositionSortOrder('Centre-Back')).toBe(1);
    expect(getPositionSortOrder('Attacking Midfielder')).toBe(2);
    expect(getPositionSortOrder('Striker')).toBe(3);
  });

  it('falls back to a partial keyword match for free-text labels', () => {
    expect(getPositionSortOrder('Backup GK')).toBe(0);
    expect(getPositionSortOrder('Right Back')).toBe(1);
    expect(getPositionSortOrder('Attacking Mid')).toBe(2);
    expect(getPositionSortOrder('Left Winger')).toBe(3);
  });
});
