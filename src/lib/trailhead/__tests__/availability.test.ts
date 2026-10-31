import { isTrickOrTrailheadEnabled } from '../availability';

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe('isTrickOrTrailheadEnabled', () => {
  it('is off on the live site', () => {
    expect(isTrickOrTrailheadEnabled(env({ VERCEL_ENV: 'production' }))).toBe(false);
  });

  it('is on for Vercel previews and in local dev', () => {
    expect(isTrickOrTrailheadEnabled(env({ VERCEL_ENV: 'preview' }))).toBe(true);
    expect(isTrickOrTrailheadEnabled(env({ VERCEL_ENV: 'development' }))).toBe(true);
    expect(isTrickOrTrailheadEnabled(env({}))).toBe(true);
  });

  it('can be launched in production with TRICK_OR_TRAILHEAD_ENABLED', () => {
    expect(isTrickOrTrailheadEnabled(env({ VERCEL_ENV: 'production', TRICK_OR_TRAILHEAD_ENABLED: 'true' }))).toBe(true);
    expect(isTrickOrTrailheadEnabled(env({ VERCEL_ENV: 'production', TRICK_OR_TRAILHEAD_ENABLED: 'false' }))).toBe(false);
  });
});
