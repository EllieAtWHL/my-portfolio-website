import { isMicrobrewPlayable } from '../availability';

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe('isMicrobrewPlayable', () => {
  it('is not playable on the live site', () => {
    expect(isMicrobrewPlayable(env({ VERCEL_ENV: 'production' }))).toBe(false);
  });

  it('is playable on Vercel previews and in local dev', () => {
    expect(isMicrobrewPlayable(env({ VERCEL_ENV: 'preview' }))).toBe(true);
    expect(isMicrobrewPlayable(env({ VERCEL_ENV: 'development' }))).toBe(true);
    expect(isMicrobrewPlayable(env({}))).toBe(true);
  });

  it('can be launched in production with MICROBREW_ENABLED', () => {
    expect(isMicrobrewPlayable(env({ VERCEL_ENV: 'production', MICROBREW_ENABLED: 'true' }))).toBe(true);
    expect(isMicrobrewPlayable(env({ VERCEL_ENV: 'production', MICROBREW_ENABLED: 'false' }))).toBe(false);
  });
});
