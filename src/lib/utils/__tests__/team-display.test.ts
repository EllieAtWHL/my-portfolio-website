import { describe, it, expect } from '@jest/globals';
import { getTeamDisplayName } from '../team-display';

describe('Team Display Utils', () => {
  describe('getTeamDisplayName', () => {
    it('should prefer short_name over name', () => {
      expect(getTeamDisplayName({ short_name: 'Chelsea', name: 'Chelsea FC Women' })).toBe('Chelsea');
    });

    it('should fall back to name when short_name is missing', () => {
      expect(getTeamDisplayName({ name: 'Chelsea FC Women' })).toBe('Chelsea FC Women');
    });

    it('should fall back to name when short_name is an empty string', () => {
      expect(getTeamDisplayName({ short_name: '', name: 'Chelsea FC Women' })).toBe('Chelsea FC Women');
    });

    it('should fall back to the default "Unknown Team" when neither field is set', () => {
      expect(getTeamDisplayName({})).toBe('Unknown Team');
      expect(getTeamDisplayName(null)).toBe('Unknown Team');
      expect(getTeamDisplayName(undefined)).toBe('Unknown Team');
    });

    it('should use a caller-supplied fallback instead of the default', () => {
      expect(getTeamDisplayName(null, '')).toBe('');
      expect(getTeamDisplayName({}, '-')).toBe('-');
    });
  });
});
