import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

function makeRssResponse(ok: boolean, text: string, status = 200) {
  return {
    ok,
    status,
    text: () => Promise.resolve(text),
  };
}

// A realistic acast-style item for the N17 Women feed
const n17ItemXml = `
<item>
<title><![CDATA[Episode 42: Big Match Preview]]></title>
<description><![CDATA[<p>We preview the big game against City.</p>]]></description>
<acast:episodeUrl>episode-42-big-match-preview</acast:episodeUrl>
<link>https://shows.acast.com/n17women/episodes/episode-42</link>
<pubDate>Mon, 01 Jun 2026 10:00:00 GMT</pubDate>
<itunes:duration>01:02:03</itunes:duration>
<enclosure url="https://media.example.com/ep42.mp3" length="123" type="audio/mpeg"/>
</item>
`;

// Hometown Glory item: no acast:episodeUrl, plain-seconds duration
const hgItemXml = `
<item>
<title>Plain Title No CDATA</title>
<description>Plain description, no CDATA here.</description>
<link>https://open.spotify.com/episode/abc123</link>
<pubDate>Tue, 02 Jun 2026 09:00:00 GMT</pubDate>
<itunes:duration>125</itunes:duration>
</item>
`;

function xmlWith(item: string) {
  return `<?xml version="1.0"?><rss><channel>${item}</channel></rss>`;
}

describe('news data layer', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).fetch;
  });

  describe('getPodcasts (RSS parsing + fallback)', () => {
    it('parses a real RSS item: CDATA title/description, acast episode URL, HH:MM:SS duration, formatted date', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).fetch = jest.fn((url: string) => {
        if (url.includes('62af54f51783a000139efa2f')) {
          return Promise.resolve(makeRssResponse(true, xmlWith(n17ItemXml)));
        }
        return Promise.resolve(makeRssResponse(true, xmlWith(hgItemXml)));
      });

      const { getPodcasts } = await import('@/lib/data/news');
      const episodes = await getPodcasts();

      const n17 = episodes.find((e) => e.podcastName === 'N17 Women')!;
      expect(n17.title).toBe('Episode 42: Big Match Preview');
      expect(n17.description).toBe('We preview the big game against City.');
      // acast episode URL construction takes priority over <link>
      expect(n17.url).toBe('https://shows.acast.com/n17women/episodes/episode-42-big-match-preview');
      expect(n17.publishDate).toBe('1 Jun 2026');
      // HH:MM:SS: hours NOT padded, minutes/seconds padded
      expect(n17.duration).toBe('1:02:03');
    });

    it('falls back to <link> for episode URL when there is no acast:episodeUrl, and formats plain-seconds duration', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).fetch = jest.fn((url: string) => {
        if (url.includes('62af54f51783a000139efa2f')) {
          return Promise.resolve(makeRssResponse(true, xmlWith(n17ItemXml)));
        }
        return Promise.resolve(makeRssResponse(true, xmlWith(hgItemXml)));
      });

      const { getPodcasts } = await import('@/lib/data/news');
      const episodes = await getPodcasts();

      const hg = episodes.find((e) => e.podcastName === 'Hometown Glory')!;
      expect(hg.title).toBe('Plain Title No CDATA');
      expect(hg.description).toBe('Plain description, no CDATA here.');
      expect(hg.url).toBe('https://open.spotify.com/episode/abc123');
      // 125s -> 2 minutes 5 seconds, padded
      expect(hg.duration).toBe('2:05');
      expect(hg.publishDate).toBe('2 Jun 2026');
    });

    it('truncates descriptions over 300 characters and appends an ellipsis', async () => {
      const longDescription = 'x'.repeat(350);
      const item = `<item><title>Long</title><description><![CDATA[${longDescription}]]></description><link>https://example.com/ep</link></item>`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).fetch = jest.fn(() => Promise.resolve(makeRssResponse(true, xmlWith(item))));

      const { getPodcasts } = await import('@/lib/data/news');
      const [episode] = await getPodcasts();

      expect(episode.description).toHaveLength(303); // 300 chars + '...'
      expect(episode.description.endsWith('...')).toBe(true);
      expect(episode.description.startsWith('x'.repeat(300))).toBe(true);
    });

    it('falls back to a static episode with the feed fallback description when the HTTP response is not ok', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).fetch = jest.fn(() => Promise.resolve(makeRssResponse(false, '', 500)));

      jest.useFakeTimers();
      try {
        const { getPodcasts } = await import('@/lib/data/news');
        const promise = getPodcasts();

        // Each of the 2 feeds retries up to 3 times (2 real backoff delays:
        // 300ms then 600ms) before falling back - advance past both, per feed.
        for (let i = 0; i < 2; i++) {
          await jest.advanceTimersByTimeAsync(300);
          await jest.advanceTimersByTimeAsync(600);
        }
        const episodes = await promise;

        const n17 = episodes.find((e) => e.podcastName === 'N17 Women')!;
        expect(n17.title).toBe('Current Episode');
        expect(n17.url).toBe('https://shows.acast.com/n17women');
        expect(n17.description).toContain('fan-produced podcast');

        const hg = episodes.find((e) => e.podcastName === 'Hometown Glory')!;
        expect(hg.title).toBe('Current Episode');
        expect(hg.url).toBe('https://open.spotify.com/show/7meFK8F2RWHACIHjoRqso9');
        expect(hg.description).toContain('Tottenham men\'s and women\'s teams');
      } finally {
        jest.useRealTimers();
      }
    });

    it('falls back to a static episode when the feed has no <item> tag at all', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).fetch = jest.fn(() => Promise.resolve(makeRssResponse(true, '<rss><channel></channel></rss>')));

      const { getPodcasts } = await import('@/lib/data/news');
      const episodes = await getPodcasts();

      expect(episodes).toHaveLength(2);
      episodes.forEach((e) => expect(e.title).toBe('Current Episode'));
    });

    it('falls back to a static episode when fetch itself rejects (network error)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).fetch = jest.fn(() => Promise.reject(new Error('network down')));

      jest.useFakeTimers();
      try {
        const { getPodcasts } = await import('@/lib/data/news');
        const promise = getPodcasts();

        for (let i = 0; i < 2; i++) {
          await jest.advanceTimersByTimeAsync(300);
          await jest.advanceTimersByTimeAsync(600);
        }
        const episodes = await promise;

        expect(episodes).toHaveLength(2);
        episodes.forEach((e) => expect(e.title).toBe('Current Episode'));
      } finally {
        jest.useRealTimers();
      }
    });

    it('retries a failing feed request up to 3 times before falling back to static data', async () => {
      const fetchMock = jest.fn(() => Promise.reject(new Error('network down')));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).fetch = fetchMock;

      jest.useFakeTimers();
      try {
        const { getPodcasts } = await import('@/lib/data/news');
        const promise = getPodcasts();

        for (let i = 0; i < 2; i++) {
          await jest.advanceTimersByTimeAsync(300);
          await jest.advanceTimersByTimeAsync(600);
        }
        await promise;

        // 2 feeds configured, 3 attempts each on a fetch that always rejects.
        expect(fetchMock).toHaveBeenCalledTimes(6);
      } finally {
        jest.useRealTimers();
      }
    });

    it('reports "Unknown Duration" and "Unknown Date" when those tags are missing', async () => {
      const item = '<item><title>No Meta</title><description>desc</description><link>https://example.com/ep</link></item>';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).fetch = jest.fn(() => Promise.resolve(makeRssResponse(true, xmlWith(item))));

      const { getPodcasts } = await import('@/lib/data/news');
      const [episode] = await getPodcasts();

      expect(episode.duration).toBe('Unknown Duration');
      expect(episode.publishDate).toBe('Unknown Date');
    });
  });

  describe('getSpursWomenNews / getSpursWomenVideos (cached wrappers)', () => {
    it('getSpursWomenNews returns the articles from the RSS layer', async () => {
      const articles = [{ title: 'A', link: 'l', pubDate: 'p', content: 'c', contentSnippet: 'cs', guid: 'g', isoDate: 'i' }];
      jest.doMock('@/lib/rss', () => ({
        fetchSpursWomenNews: jest.fn(async () => articles),
        fetchSpursWomenVideos: jest.fn(async () => []),
      }));

      const { getSpursWomenNews } = await import('@/lib/data/news');
      const result = await getSpursWomenNews();

      expect(result).toEqual(articles);
    });

    it('getSpursWomenNews rejects when the RSS layer keeps failing', async () => {
      jest.doMock('@/lib/rss', () => ({
        fetchSpursWomenNews: jest.fn(async () => { throw new Error('rss down'); }),
        fetchSpursWomenVideos: jest.fn(async () => []),
      }));

      const { getSpursWomenNews } = await import('@/lib/data/news');
      await expect(getSpursWomenNews()).rejects.toBeTruthy();
    });

    it('getSpursWomenVideos returns the videos from the RSS layer', async () => {
      const videos = [{ title: 'V', link: 'l', pubDate: 'p', videoId: 'id', thumbnail: 't', description: 'd' }];
      jest.doMock('@/lib/rss', () => ({
        fetchSpursWomenNews: jest.fn(async () => []),
        fetchSpursWomenVideos: jest.fn(async () => videos),
      }));

      const { getSpursWomenVideos } = await import('@/lib/data/news');
      const result = await getSpursWomenVideos();

      expect(result).toEqual(videos);
    });
  });

  describe('getHomePageContent (composition)', () => {
    it('composes matches/news/videos/podcasts, slicing news to 6 and podcasts to 2, passing matches/videos through unchanged', async () => {
      const upcoming = [{ id: 'u1' }];
      const previous = [{ id: 'p1' }];
      jest.doMock('@/lib/data/matches', () => ({
        getHomePageMatches: jest.fn(async () => ({ upcoming, previous })),
      }));

      const eightNews = Array.from({ length: 8 }, (_, i) => ({
        title: `Article ${i}`,
        link: `l${i}`,
        pubDate: 'p',
        content: 'c',
        contentSnippet: 'cs',
        guid: `g${i}`,
        isoDate: 'i',
      }));
      const videos = [{ title: 'V', link: 'l', pubDate: 'p', videoId: 'id', thumbnail: 't', description: 'd' }];
      jest.doMock('@/lib/rss', () => ({
        fetchSpursWomenNews: jest.fn(async () => eightNews),
        fetchSpursWomenVideos: jest.fn(async () => videos),
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).fetch = jest.fn(() => Promise.resolve(makeRssResponse(true, xmlWith(n17ItemXml))));

      const { getHomePageContent } = await import('@/lib/data/news');
      const content = await getHomePageContent();

      expect(content.upcoming).toEqual(upcoming);
      expect(content.previous).toEqual(previous);
      expect(content.news).toHaveLength(6);
      expect(content.news.map((n) => n.title)).toEqual(eightNews.slice(0, 6).map((n) => n.title));
      expect(content.videos).toEqual(videos);
      // Only 2 podcast feeds are configured, so length <= 2 is inherent -
      // this asserts the slice doesn't somehow drop below that.
      expect(content.podcasts).toHaveLength(2);
    });
  });
});
