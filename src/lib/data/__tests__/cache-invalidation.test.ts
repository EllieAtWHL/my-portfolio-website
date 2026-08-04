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
