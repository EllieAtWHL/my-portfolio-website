import { getSocialPlatform } from '../social-embed';

describe('getSocialPlatform', () => {
  it.each([
    ['https://bsky.app/profile/someone.bsky.social/post/3abc', 'bluesky'],
    ['https://www.instagram.com/p/C1abcDEF/', 'instagram'],
    ['https://instagram.com/reel/C1abcDEF/', 'instagram'],
    ['https://WWW.Instagram.com/p/C1abcDEF/', 'instagram'],
  ])('detects %s as %s', (url, platform) => {
    expect(getSocialPlatform(url)).toBe(platform);
  });

  it.each([
    'https://x.com/someone/status/123',
    'https://notinstagram.com/p/abc',
    'https://instagram.com.evil.example/p/abc',
    'not a url',
    '',
  ])('returns null for %s', (url) => {
    expect(getSocialPlatform(url)).toBeNull();
  });
});
