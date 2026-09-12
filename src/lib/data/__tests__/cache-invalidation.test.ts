import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const mockRevalidateCacheTags = jest.fn();

jest.mock('../cache-server', () => ({
  revalidateCacheTags: (...args: unknown[]) => mockRevalidateCacheTags(...args),
}));

import {
  invalidateMatchCache,
  invalidateSeasonCache,
  invalidateMediaCache,
  invalidateNewsCache,
  invalidateVideoCache,
  invalidatePlayerCache,
  invalidateTeamCache,
  invalidatePlayerHistoryCache,
  invalidatePlayerStatsCache,
  invalidateStadiumCache,
  invalidateStadiumNamesCache,
  invalidateAllRelatedCaches,
  invalidateCacheByEntityType,
} from '../cache-invalidation';
import { CACHE_TAGS } from '../cache-utils';

describe('cache-invalidation', () => {
  let warnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    mockRevalidateCacheTags.mockClear();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('invalidateMatchCache', () => {
    it('invalidates the MATCHES tag', () => {
      invalidateMatchCache();
      expect(mockRevalidateCacheTags).toHaveBeenCalledTimes(1);
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.MATCHES]);
    });
  });

  describe('invalidateSeasonCache', () => {
    it('invalidates the SEASONS tag', () => {
      invalidateSeasonCache();
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.SEASONS]);
    });
  });

  describe('invalidateMediaCache', () => {
    it('invalidates the MEDIA tag', () => {
      invalidateMediaCache();
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.MEDIA]);
    });
  });

  describe('invalidateNewsCache', () => {
    it('invalidates the NEWS tag', () => {
      invalidateNewsCache();
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.NEWS]);
    });
  });

  describe('invalidateVideoCache', () => {
    it('invalidates the VIDEOS tag', () => {
      invalidateVideoCache();
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.VIDEOS]);
    });
  });

  describe('invalidatePlayerCache', () => {
    it('invalidates the PLAYERS tag', () => {
      invalidatePlayerCache();
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.PLAYERS]);
    });
  });

  describe('invalidateTeamCache', () => {
    it('invalidates the TEAMS tag', () => {
      invalidateTeamCache();
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.TEAMS]);
    });
  });

  describe('invalidatePlayerHistoryCache', () => {
    it('invalidates both the PLAYERS and TEAMS tags', () => {
      invalidatePlayerHistoryCache();
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.PLAYERS, CACHE_TAGS.TEAMS]);
    });
  });

  describe('invalidatePlayerStatsCache', () => {
    it('invalidates both the PLAYERS and MATCHES tags', () => {
      invalidatePlayerStatsCache();
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.PLAYERS, CACHE_TAGS.MATCHES]);
    });
  });

  describe('invalidateStadiumCache', () => {
    it('invalidates both the STADIUMS and MATCHES tags', () => {
      invalidateStadiumCache();
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.STADIUMS, CACHE_TAGS.MATCHES]);
    });
  });

  describe('invalidateStadiumNamesCache', () => {
    it('invalidates the STADIUM_NAMES, STADIUMS, and MATCHES tags', () => {
      invalidateStadiumNamesCache();
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([
        CACHE_TAGS.STADIUM_NAMES,
        CACHE_TAGS.STADIUMS,
        CACHE_TAGS.MATCHES,
      ]);
    });
  });

  describe('invalidateAllRelatedCaches', () => {
    it('invalidates every tag defined in CACHE_TAGS', () => {
      invalidateAllRelatedCaches();
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith(Object.values(CACHE_TAGS));
    });
  });

  describe('invalidateCacheByEntityType', () => {
    it('dispatches "match" to invalidateMatchCache (MATCHES tag)', () => {
      invalidateCacheByEntityType('match');
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.MATCHES]);
    });

    it('dispatches "season" to invalidateSeasonCache (SEASONS tag)', () => {
      invalidateCacheByEntityType('season');
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.SEASONS]);
    });

    it('dispatches "media" to invalidateMediaCache (MEDIA tag)', () => {
      invalidateCacheByEntityType('media');
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.MEDIA]);
    });

    it('dispatches "news" to invalidateNewsCache (NEWS tag)', () => {
      invalidateCacheByEntityType('news');
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.NEWS]);
    });

    it('dispatches "video" to invalidateVideoCache (VIDEOS tag)', () => {
      invalidateCacheByEntityType('video');
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.VIDEOS]);
    });

    it('dispatches "player" to invalidatePlayerCache (PLAYERS tag)', () => {
      invalidateCacheByEntityType('player');
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.PLAYERS]);
    });

    it('dispatches "team" to invalidateTeamCache (TEAMS tag)', () => {
      invalidateCacheByEntityType('team');
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.TEAMS]);
    });

    it('dispatches "playerHistory" to invalidatePlayerHistoryCache (PLAYERS + TEAMS tags)', () => {
      invalidateCacheByEntityType('playerHistory');
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.PLAYERS, CACHE_TAGS.TEAMS]);
    });

    it('dispatches "playerStats" to invalidatePlayerStatsCache (PLAYERS + MATCHES tags)', () => {
      invalidateCacheByEntityType('playerStats');
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.PLAYERS, CACHE_TAGS.MATCHES]);
    });

    it('dispatches "stadium" to invalidateStadiumCache (STADIUMS + MATCHES tags)', () => {
      invalidateCacheByEntityType('stadium');
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([CACHE_TAGS.STADIUMS, CACHE_TAGS.MATCHES]);
    });

    it('dispatches "stadiumName" to invalidateStadiumNamesCache (STADIUM_NAMES + STADIUMS + MATCHES tags)', () => {
      invalidateCacheByEntityType('stadiumName');
      expect(mockRevalidateCacheTags).toHaveBeenCalledWith([
        CACHE_TAGS.STADIUM_NAMES,
        CACHE_TAGS.STADIUMS,
        CACHE_TAGS.MATCHES,
      ]);
    });

    it('warns and does not invalidate anything for an unknown entity type', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      invalidateCacheByEntityType('unknown-type' as any);

      expect(mockRevalidateCacheTags).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown entity type for cache invalidation: unknown-type')
      );
    });
  });
});
