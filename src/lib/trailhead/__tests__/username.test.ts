import { parseTrailheadUsername } from '../username';

describe('parseTrailheadUsername', () => {
  it('accepts a bare username, trimmed', () => {
    expect(parseTrailheadUsername('elliematthewman')).toBe('elliematthewman');
    expect(parseTrailheadUsername('  elliematthewman \n')).toBe('elliematthewman');
    expect(parseTrailheadUsername('ellie-matthewman_2.0')).toBe('ellie-matthewman_2.0');
  });

  it('lowercases, since Trailhead slugs are case-insensitive', () => {
    expect(parseTrailheadUsername('ElLieMatthewMAN')).toBe('elliematthewman');
    expect(parseTrailheadUsername('https://trailblazer.me/id/EllieMatthewman')).toBe('elliematthewman');
  });

  it.each([
    'https://trailblazer.me/id/elliematthewman',
    'http://trailblazer.me/id/elliematthewman/',
    'https://www.salesforce.com/trailblazer/elliematthewman',
    'https://salesforce.com/trailblazer/elliematthewman?tab=badges',
    'https://WWW.Salesforce.com/Trailblazer/elliematthewman',
    'https://www.trailblazer.me/id/elliematthewman',
    'https://www.salesforce.com/uk/trailblazer/elliematthewman',
    'https://www.salesforce.com/en-gb/trailblazer/elliematthewman',
    'trailblazer.me/id/elliematthewman',
    'www.salesforce.com/trailblazer/elliematthewman',
  ])('extracts the username from %s', (input) => {
    expect(parseTrailheadUsername(input)).toBe('elliematthewman');
  });

  it('finds a profile URL pasted with surrounding text or punctuation', () => {
    expect(parseTrailheadUsername('my profile: https://trailblazer.me/id/elliematthewman.')).toBe('elliematthewman');
    expect(parseTrailheadUsername('(https://www.salesforce.com/trailblazer/elliematthewman)')).toBe('elliematthewman');
  });

  it.each(['', '   ', 'ellie matthewman', 'ellie@example.com', 'ellie/matthewman', 'ellie?x=1', 'a'.repeat(81)])(
    'rejects %p',
    (input) => {
      expect(parseTrailheadUsername(input)).toBeNull();
    }
  );

  it.each([
    'https://example.com/id/elliematthewman',
    'https://trailblazer.me/elliematthewman',
    'https://trailblazer.me/id/',
    'https://trailblazer.me/id/elliematthewman/badges',
    'https://www.salesforce.com/blog/trick-or-trailhead',
    'https://www.salesforce.com/uk/blog/trick-or-trailhead',
    'https://www.salesforce.com/united-kingdom/trailblazer/elliematthewman',
    'https://trailblazer.me/uk/id/elliematthewman',
    'https://trailblazer.me/id/%E0%A4%A',
    'https://',
    'not a/url',
  ])('rejects URLs that are not a profile: %s', (input) => {
    expect(parseTrailheadUsername(input)).toBeNull();
  });
});
