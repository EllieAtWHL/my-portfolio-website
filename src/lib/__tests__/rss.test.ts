jest.mock('rss-parser', () => {
  return jest.fn().mockImplementation(() => ({
    parseURL: jest.fn(),
  }));
});

import Parser from 'rss-parser';
import { fetchSpursWomenNews, fetchSpursWomenVideos } from '../rss';

// src/lib/rss.ts instantiates `new Parser(...)` exactly once at module load
// time, so the single mocked instance (and its parseURL jest.fn()) can be
// recovered from the mock constructor's recorded results.
const MockedParser = Parser as unknown as jest.Mock;
const mockParseURL = MockedParser.mock.results[0].value.parseURL as jest.Mock;

// spursSources order (from src/lib/rss.ts), used to target parseURL calls by index:
// 0: spurswomen.uk (Spurs Women Blog - always included)
// 1: veintefutbol
// 2: spurs-across-the-pond
// 3: bbc
// 4: fawslfulltime
// 5: shekicks
// 6: theguardian
// 7: cartilagefreecaptain (CFC)
// 8: girlsontheball

function emptyFeed() {
  return { items: [] };
}

describe('fetchSpursWomenNews', () => {
  beforeEach(() => {
    mockParseURL.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('includes every article from the dedicated Spurs Women Blog source unconditionally', async () => {
    mockParseURL.mockImplementation(async (url: string) => {
      if (url.includes('spurswomen')) {
        return {
          items: [
            {
              title: 'Totally unrelated title',
              link: 'https://spurswomen.uk/a',
              pubDate: '2026-01-01',
              content: 'no keywords here at all',
              contentSnippet: 'no keywords here at all',
              guid: 'a',
              isoDate: '2026-01-01T00:00:00Z',
            },
          ],
        };
      }
      return emptyFeed();
    });

    const result = await fetchSpursWomenNews();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      title: 'Totally unrelated title',
      source: 'Spurs Women Blog',
    });
  });

  it('includes Cartilage Free Captain articles categorised "Tottenham Hotspur Women" even without women\'s keywords in the text', async () => {
    mockParseURL.mockImplementation(async (url: string) => {
      if (url.includes('cartilagefreecaptain')) {
        return {
          items: [
            {
              title: 'Match report',
              link: 'https://cartilagefreecaptain.sbnation.com/a',
              pubDate: '2026-01-01',
              content: 'general content',
              contentSnippet: 'general content',
              guid: 'cfc-a',
              isoDate: '2026-01-01T00:00:00Z',
              categories: [{ term: 'Tottenham Hotspur Women' }],
            },
          ],
        };
      }
      return emptyFeed();
    });

    const result = await fetchSpursWomenNews();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ source: 'Cartilage Free Captain', title: 'Match report' });
  });

  it('excludes a Cartilage Free Captain article without the Tottenham Hotspur Women category, even if the title mentions Spurs', async () => {
    mockParseURL.mockImplementation(async (url: string) => {
      if (url.includes('cartilagefreecaptain')) {
        return {
          items: [
            {
              title: 'Tottenham transfer news',
              link: 'https://cartilagefreecaptain.sbnation.com/b',
              pubDate: '2026-01-01',
              content: 'transfer rumours about the men\'s team',
              contentSnippet: 'transfer rumours',
              guid: 'cfc-b',
              isoDate: '2026-01-01T00:00:00Z',
              categories: [{ term: 'Tottenham Hotspur' }],
            },
          ],
        };
      }
      return emptyFeed();
    });

    const result = await fetchSpursWomenNews();

    expect(result).toHaveLength(0);
  });

  it('includes a generic source article that has both Spurs and women\'s keywords and no exclusion keywords', async () => {
    mockParseURL.mockImplementation(async (url: string) => {
      if (url.includes('bbci.co.uk')) {
        return {
          items: [
            {
              title: 'Tottenham Hotspur Women beat Arsenal in WSL clash',
              link: 'https://bbc.co.uk/a',
              pubDate: '2026-01-01',
              content: 'A great win for the Lilywhites in the Womens Super League',
              contentSnippet: 'A great win for the Lilywhites in the Womens Super League',
              guid: 'bbc-a',
              isoDate: '2026-01-02T00:00:00Z',
            },
          ],
        };
      }
      return emptyFeed();
    });

    const result = await fetchSpursWomenNews();

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('BBC Sport');
  });

  it('excludes a generic source article that has Spurs keywords but no women\'s keywords', async () => {
    mockParseURL.mockImplementation(async (url: string) => {
      if (url.includes('bbci.co.uk')) {
        return {
          items: [
            {
              title: 'Tottenham Hotspur beat Arsenal',
              link: 'https://bbc.co.uk/b',
              pubDate: '2026-01-01',
              content: 'A great win for the Lilywhites',
              contentSnippet: 'A great win for the Lilywhites',
              guid: 'bbc-b',
              isoDate: '2026-01-01T00:00:00Z',
            },
          ],
        };
      }
      return emptyFeed();
    });

    const result = await fetchSpursWomenNews();

    expect(result).toHaveLength(0);
  });

  it('excludes a generic source article with Spurs + women\'s keywords when a strong men\'s indicator is also present', async () => {
    mockParseURL.mockImplementation(async (url: string) => {
      if (url.includes('theguardian')) {
        return {
          items: [
            {
              title: 'Tottenham Hotspur Women and the men\'s team news roundup',
              link: 'https://theguardian.com/a',
              pubDate: '2026-01-01',
              content: 'Meanwhile the men\'s team also played in the premier league',
              contentSnippet: 'Meanwhile the men\'s team also played in the premier league',
              guid: 'gdn-a',
              isoDate: '2026-01-01T00:00:00Z',
            },
          ],
        };
      }
      return emptyFeed();
    });

    const result = await fetchSpursWomenNews();

    expect(result).toHaveLength(0);
  });

  it('excludes a generic source article with Spurs + women\'s keywords when it matches general roundup/open-thread content', async () => {
    mockParseURL.mockImplementation(async (url: string) => {
      if (url.includes('shekicks')) {
        return {
          items: [
            {
              title: 'Open thread: Tottenham Hotspur Women WSL news and links',
              link: 'https://shekicks.net/a',
              pubDate: '2026-01-01',
              content: 'roundup of the week',
              contentSnippet: 'roundup of the week',
              guid: 'sk-a',
              isoDate: '2026-01-01T00:00:00Z',
            },
          ],
        };
      }
      return emptyFeed();
    });

    const result = await fetchSpursWomenNews();

    expect(result).toHaveLength(0);
  });

  it('does not false-positive-exclude "women\'s team" as a men\'s-team match via word-boundary matching', async () => {
    mockParseURL.mockImplementation(async (url: string) => {
      if (url.includes('shekicks')) {
        return {
          items: [
            {
              title: 'Tottenham Hotspur women\'s team WSL preview',
              link: 'https://shekicks.net/b',
              pubDate: '2026-01-01',
              content: 'The Lilywhites womens team look ahead to their next match',
              contentSnippet: 'The Lilywhites womens team look ahead to their next match',
              guid: 'sk-b',
              isoDate: '2026-01-02T00:00:00Z',
            },
          ],
        };
      }
      return emptyFeed();
    });

    const result = await fetchSpursWomenNews();

    expect(result).toHaveLength(1);
  });

  it('treats an empty-items feed as invalid and logs an error, contributing zero articles', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockParseURL.mockResolvedValue(emptyFeed());

    const result = await fetchSpursWomenNews();

    expect(result).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('treats a feed with no items property the same as an empty feed, without throwing', async () => {
    mockParseURL.mockImplementation(async (url: string) => {
      if (url.includes('spurswomen')) {
        return {}; // no `.items` at all
      }
      return emptyFeed();
    });

    const result = await fetchSpursWomenNews();

    expect(result).toEqual([]);
  });

  it('does not fail the whole batch when one feed source throws - other sources still contribute', async () => {
    mockParseURL.mockImplementation(async (url: string) => {
      if (url.includes('spurswomen')) {
        throw new Error('feed down');
      }
      if (url.includes('bbci.co.uk')) {
        return {
          items: [
            {
              title: 'Tottenham Hotspur Women beat Chelsea in the WSL',
              link: 'https://bbc.co.uk/c',
              pubDate: '2026-01-01',
              content: 'a dominant away win',
              contentSnippet: 'a dominant away win',
              guid: 'bbc-c',
              isoDate: '2026-01-01T00:00:00Z',
            },
          ],
        };
      }
      return emptyFeed();
    });

    const result = await fetchSpursWomenNews();

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('BBC Sport');
  });

  it('retries a source up to 3 times on transient failure before giving up on it', async () => {
    jest.useFakeTimers();
    try {
      mockParseURL.mockImplementation(async (url: string) => {
        if (url.includes('spurswomen')) {
          throw new Error('feed down');
        }
        return emptyFeed();
      });

      const promise = fetchSpursWomenNews();

      // Let each source's first attempt (and the failing source's two
      // retries) settle - no real waiting, since retryWithBackoff's only
      // real timer is its own backoff delay between attempts.
      await jest.advanceTimersByTimeAsync(300);
      await jest.advanceTimersByTimeAsync(600);
      await promise;

      const spurswomenCalls = mockParseURL.mock.calls.filter(([url]) => url.includes('spurswomen'));
      expect(spurswomenCalls).toHaveLength(3);
    } finally {
      jest.useRealTimers();
    }
  });

  it('sorts included articles newest first by isoDate and caps the result at 20', async () => {
    mockParseURL.mockImplementation(async (url: string) => {
      if (url.includes('spurswomen')) {
        return {
          items: Array.from({ length: 25 }, (_, i) => ({
            title: `Article ${i}`,
            link: `https://spurswomen.uk/${i}`,
            pubDate: '2026-01-01',
            content: '',
            contentSnippet: '',
            guid: `sw-${i}`,
            // staggered dates, article 0 is oldest, article 24 is newest
            isoDate: new Date(2026, 0, 1 + i).toISOString(),
          })),
        };
      }
      return emptyFeed();
    });

    const result = await fetchSpursWomenNews();

    expect(result).toHaveLength(20);
    expect(result[0].title).toBe('Article 24');
    expect(result[19].title).toBe('Article 5');
  });
});

describe('fetchSpursWomenVideos', () => {
  beforeEach(() => {
    mockParseURL.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('extracts a videoId from a watch?v= link and builds a thumbnail URL', async () => {
    mockParseURL.mockResolvedValue({
      items: [
        {
          title: 'Highlights',
          link: 'https://www.youtube.com/watch?v=abc123XYZ',
          pubDate: '2026-01-01',
          content: 'desc',
        },
      ],
    });

    const result = await fetchSpursWomenVideos();

    expect(result).toEqual([
      {
        title: 'Highlights',
        link: 'https://www.youtube.com/watch?v=abc123XYZ',
        pubDate: '2026-01-01',
        videoId: 'abc123XYZ',
        thumbnail: 'https://img.youtube.com/vi/abc123XYZ/mqdefault.jpg',
        description: 'desc',
      },
    ]);
  });

  it('extracts a videoId from a youtu.be short link', async () => {
    mockParseURL.mockResolvedValue({
      items: [{ title: 'Short', link: 'https://youtu.be/short123', pubDate: '2026-01-01' }],
    });

    const result = await fetchSpursWomenVideos();

    expect(result[0].videoId).toBe('short123');
    expect(result[0].thumbnail).toBe('https://img.youtube.com/vi/short123/mqdefault.jpg');
  });

  it('extracts a videoId from a /shorts/ link', async () => {
    mockParseURL.mockResolvedValue({
      items: [{ title: 'A Short', link: 'https://www.youtube.com/shorts/shortabc', pubDate: '2026-01-01' }],
    });

    const result = await fetchSpursWomenVideos();

    expect(result[0].videoId).toBe('shortabc');
  });

  it('falls back to an empty videoId/thumbnail when the link has no recognisable id', async () => {
    mockParseURL.mockResolvedValue({
      items: [{ title: 'No id', link: 'https://example.com/video', pubDate: '2026-01-01' }],
    });

    const result = await fetchSpursWomenVideos();

    expect(result[0].videoId).toBe('');
    expect(result[0].thumbnail).toBe('');
  });

  it('limits results to the first 6 items from the feed', async () => {
    mockParseURL.mockResolvedValue({
      items: Array.from({ length: 10 }, (_, i) => ({
        title: `Video ${i}`,
        link: `https://youtu.be/vid${i}`,
        pubDate: '2026-01-01',
      })),
    });

    const result = await fetchSpursWomenVideos();

    expect(result).toHaveLength(6);
    expect(result[0].title).toBe('Video 0');
    expect(result[5].title).toBe('Video 5');
  });

  it('returns an empty array when the only channel fails', async () => {
    mockParseURL.mockRejectedValue(new Error('channel down'));

    const result = await fetchSpursWomenVideos();

    expect(result).toEqual([]);
  });

  it('returns an empty array when the feed has no items', async () => {
    mockParseURL.mockResolvedValue(emptyFeed());

    const result = await fetchSpursWomenVideos();

    expect(result).toEqual([]);
  });

  it('uses contentSnippet as the description fallback when content is absent', async () => {
    mockParseURL.mockResolvedValue({
      items: [
        {
          title: 'Snippet Video',
          link: 'https://youtu.be/snippetvid',
          pubDate: '2026-01-01',
          contentSnippet: 'snippet text',
        },
      ],
    });

    const result = await fetchSpursWomenVideos();

    expect(result[0].description).toBe('snippet text');
  });
});
