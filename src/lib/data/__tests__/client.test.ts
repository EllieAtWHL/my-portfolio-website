import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  getUpcomingMatchesClient,
  getPreviousMatchesClient,
  getSpursWomenNewsClient,
  getSpursWomenVideosClient,
  getPodcastsClient,
  getHomePageContentClient,
  getSeasonsListClient,
} from '../client';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe('data/client', () => {
  let fetchSpy: jest.SpiedFunction<typeof global.fetch>;
  let errorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('getUpcomingMatchesClient', () => {
    it('requests the default limit of 3 and returns data.matches on success', async () => {
      const matches = [{ id: 1 }, { id: 2 }];
      fetchSpy.mockResolvedValue(jsonResponse({ matches }));

      const result = await getUpcomingMatchesClient();

      expect(fetchSpy).toHaveBeenCalledWith('/api/cache/matches/upcoming?limit=3');
      expect(result).toEqual(matches);
    });

    it('passes a custom limit through to the query string', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ matches: [] }));

      await getUpcomingMatchesClient(7);

      expect(fetchSpy).toHaveBeenCalledWith('/api/cache/matches/upcoming?limit=7');
    });

    it('returns [] when the response body has no matches key', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}));

      const result = await getUpcomingMatchesClient();

      expect(result).toEqual([]);
    });

    it('returns [] and logs when the response is not ok', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}, false, 500));

      const result = await getUpcomingMatchesClient();

      expect(result).toEqual([]);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching upcoming matches:',
        expect.any(Error)
      );
    });

    it('returns [] and logs when fetch itself throws', async () => {
      fetchSpy.mockRejectedValue(new Error('network down'));

      const result = await getUpcomingMatchesClient();

      expect(result).toEqual([]);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching upcoming matches:',
        expect.any(Error)
      );
    });
  });

  describe('getPreviousMatchesClient', () => {
    it('requests the default limit of 3 and returns data.matches on success', async () => {
      const matches = [{ id: 9 }];
      fetchSpy.mockResolvedValue(jsonResponse({ matches }));

      const result = await getPreviousMatchesClient();

      expect(fetchSpy).toHaveBeenCalledWith('/api/cache/matches/previous?limit=3');
      expect(result).toEqual(matches);
    });

    it('passes a custom limit through to the query string', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ matches: [] }));

      await getPreviousMatchesClient(1);

      expect(fetchSpy).toHaveBeenCalledWith('/api/cache/matches/previous?limit=1');
    });

    it('returns [] when the response is not ok', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}, false, 404));

      const result = await getPreviousMatchesClient();

      expect(result).toEqual([]);
    });

    it('returns [] when fetch throws', async () => {
      fetchSpy.mockRejectedValue(new Error('boom'));

      const result = await getPreviousMatchesClient();

      expect(result).toEqual([]);
    });
  });

  describe('getSpursWomenNewsClient', () => {
    it('hits /api/spurs-women-news and returns data.news', async () => {
      const news = [{ title: 'Article' }];
      fetchSpy.mockResolvedValue(jsonResponse({ news }));

      const result = await getSpursWomenNewsClient();

      expect(fetchSpy).toHaveBeenCalledWith('/api/spurs-women-news');
      expect(result).toEqual(news);
    });

    it('returns [] when not ok', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}, false, 500));
      expect(await getSpursWomenNewsClient()).toEqual([]);
    });

    it('returns [] when fetch throws', async () => {
      fetchSpy.mockRejectedValue(new Error('fail'));
      expect(await getSpursWomenNewsClient()).toEqual([]);
    });

    it('returns [] when data.news is missing', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}));
      expect(await getSpursWomenNewsClient()).toEqual([]);
    });
  });

  describe('getSpursWomenVideosClient', () => {
    it('hits /api/spurs-women-videos and returns data.videos', async () => {
      const videos = [{ videoId: 'abc' }];
      fetchSpy.mockResolvedValue(jsonResponse({ videos }));

      const result = await getSpursWomenVideosClient();

      expect(fetchSpy).toHaveBeenCalledWith('/api/spurs-women-videos');
      expect(result).toEqual(videos);
    });

    it('returns [] when not ok', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}, false, 500));
      expect(await getSpursWomenVideosClient()).toEqual([]);
    });

    it('returns [] when fetch throws', async () => {
      fetchSpy.mockRejectedValue(new Error('fail'));
      expect(await getSpursWomenVideosClient()).toEqual([]);
    });
  });

  describe('getPodcastsClient', () => {
    it('hits /api/podcasts and returns data.episodes', async () => {
      const episodes = [{ title: 'Ep 1' }];
      fetchSpy.mockResolvedValue(jsonResponse({ episodes }));

      const result = await getPodcastsClient();

      expect(fetchSpy).toHaveBeenCalledWith('/api/podcasts');
      expect(result).toEqual(episodes);
    });

    it('returns [] when not ok', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}, false, 500));
      expect(await getPodcastsClient()).toEqual([]);
    });

    it('returns [] when fetch throws', async () => {
      fetchSpy.mockRejectedValue(new Error('fail'));
      expect(await getPodcastsClient()).toEqual([]);
    });
  });

  describe('getSeasonsListClient', () => {
    it('hits /api/seasons and returns data.seasons', async () => {
      const seasons = [{ id: 1, name: '2025/26' }];
      fetchSpy.mockResolvedValue(jsonResponse({ seasons }));

      const result = await getSeasonsListClient();

      expect(fetchSpy).toHaveBeenCalledWith('/api/seasons');
      expect(result).toEqual(seasons);
    });

    it('returns [] when not ok', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}, false, 500));
      expect(await getSeasonsListClient()).toEqual([]);
    });

    it('returns [] when fetch throws', async () => {
      fetchSpy.mockRejectedValue(new Error('fail'));
      expect(await getSeasonsListClient()).toEqual([]);
    });
  });

  describe('getHomePageContentClient', () => {
    it('composes all five endpoints and slices news to 6 and podcasts to 2', async () => {
      const upcoming = [{ id: 'u1' }, { id: 'u2' }];
      const previous = [{ id: 'p1' }];
      const news = Array.from({ length: 10 }, (_, i) => ({ title: `News ${i}` }));
      const videos = [{ videoId: 'v1' }, { videoId: 'v2' }];
      const podcasts = Array.from({ length: 5 }, (_, i) => ({ title: `Pod ${i}` }));

      fetchSpy.mockImplementation((async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cache/matches/upcoming')) return jsonResponse({ matches: upcoming });
        if (url.includes('/api/cache/matches/previous')) return jsonResponse({ matches: previous });
        if (url.includes('/api/spurs-women-news')) return jsonResponse({ news });
        if (url.includes('/api/spurs-women-videos')) return jsonResponse({ videos });
        if (url.includes('/api/podcasts')) return jsonResponse({ episodes: podcasts });
        throw new Error(`Unexpected URL: ${url}`);
      }) as typeof global.fetch);

      const result = await getHomePageContentClient();

      expect(result.upcoming).toEqual(upcoming);
      expect(result.previous).toEqual(previous);
      expect(result.videos).toEqual(videos);
      expect(result.news).toEqual(news.slice(0, 6));
      expect(result.news).toHaveLength(6);
      expect(result.podcasts).toEqual(podcasts.slice(0, 2));
      expect(result.podcasts).toHaveLength(2);
    });

    it('does not blow up (slices produce empty arrays) when a call fails and falls back to []', async () => {
      fetchSpy.mockImplementation((async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cache/matches/upcoming')) return jsonResponse({ matches: [{ id: 1 }] });
        if (url.includes('/api/cache/matches/previous')) return jsonResponse({ matches: [] });
        if (url.includes('/api/spurs-women-news')) return jsonResponse({}, false, 500);
        if (url.includes('/api/spurs-women-videos')) return jsonResponse({ videos: [] });
        if (url.includes('/api/podcasts')) return jsonResponse({}, false, 500);
        throw new Error(`Unexpected URL: ${url}`);
      }) as typeof global.fetch);

      const result = await getHomePageContentClient();

      expect(result.news).toEqual([]);
      expect(result.podcasts).toEqual([]);
      expect(result.upcoming).toEqual([{ id: 1 }]);
    });

    it('requests upcoming/previous with a limit of 3 each, regardless of the final home page slice sizes', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ matches: [], news: [], videos: [], episodes: [] }));

      await getHomePageContentClient();

      expect(fetchSpy).toHaveBeenCalledWith('/api/cache/matches/upcoming?limit=3');
      expect(fetchSpy).toHaveBeenCalledWith('/api/cache/matches/previous?limit=3');
    });
  });
});
