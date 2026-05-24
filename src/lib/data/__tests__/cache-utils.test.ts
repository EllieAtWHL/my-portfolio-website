import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CacheError, CACHE_TTL, CACHE_TAGS, CACHE_KEYS, createCachedFunction, type CacheOptions } from '../cache-utils';

describe('Cache Utils', () => {
  describe('CacheError', () => {
    it('should create a CacheError with message', () => {
      const error = new CacheError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('CacheError');
      expect(error.originalError).toBeUndefined();
    });

    it('should create a CacheError with original error', () => {
      const originalError = new Error('Original error');
      const error = new CacheError('Test error', originalError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('CacheError');
      expect(error.originalError).toBe(originalError);
    });

    it('should be instanceof Error', () => {
      const error = new CacheError('Test error');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('CACHE_TTL', () => {
    it('should have all required TTL constants', () => {
      expect(CACHE_TTL.STATIC_CONTENT).toBe(24 * 60 * 60);
      expect(CACHE_TTL.CURRENT_SEASON_MATCHES).toBe(30 * 60);
      expect(CACHE_TTL.LIVE_MATCH_DATA).toBe(5 * 60);
      expect(CACHE_TTL.PAST_SEASONS).toBe(7 * 24 * 60 * 60);
      expect(CACHE_TTL.YOUTUBE_VIDEOS).toBe(60 * 60);
      expect(CACHE_TTL.RSS_FEEDS).toBe(24 * 60 * 60);
      expect(CACHE_TTL.MEDIA).toBe(6 * 60 * 60);
      expect(CACHE_TTL.STADIUM_DATA).toBe(24 * 60 * 60);
      expect(CACHE_TTL.PLAYER_DATA).toBe(60 * 60);
      expect(CACHE_TTL.PLAYER_STATS).toBe(30 * 60);
    });
  });

  describe('CACHE_TAGS', () => {
    it('should have all required cache tags', () => {
      expect(CACHE_TAGS.MATCHES).toBe('matches');
      expect(CACHE_TAGS.UPCOMING_MATCHES).toBe('upcoming-matches');
      expect(CACHE_TAGS.PREVIOUS_MATCHES).toBe('previous-matches');
      expect(CACHE_TAGS.SEASONS).toBe('seasons');
      expect(CACHE_TAGS.NEWS).toBe('news');
      expect(CACHE_TAGS.VIDEOS).toBe('videos');
      expect(CACHE_TAGS.PODCASTS).toBe('podcasts');
      expect(CACHE_TAGS.MEDIA).toBe('media');
      expect(CACHE_TAGS.STADIUMS).toBe('stadiums');
      expect(CACHE_TAGS.STADIUM_NAMES).toBe('stadium-names');
      expect(CACHE_TAGS.PLAYERS).toBe('players');
      expect(CACHE_TAGS.PLAYER_STATS).toBe('player-stats');
    });
  });

  describe('CACHE_KEYS', () => {
    it('should generate match keys correctly', () => {
      expect(CACHE_KEYS.matches()).toBe('matches');
      expect(CACHE_KEYS.matches('2023-24')).toBe('matches:2023-24');
      expect(CACHE_KEYS.matches('2023-24', 'WSL')).toBe('matches:2023-24:WSL');
      expect(CACHE_KEYS.matches('2023-24', 'WSL', 'latest')).toBe('matches:2023-24:WSL:latest');
    });

    it('should generate season summary keys correctly', () => {
      expect(CACHE_KEYS.seasonSummary('2023-24')).toBe('season-summary:2023-24');
    });

    it('should generate article keys correctly', () => {
      expect(CACHE_KEYS.article('test-slug')).toBe('article:slug:test-slug');
    });

    it('should generate news keys correctly', () => {
      expect(CACHE_KEYS.news()).toBe('news');
      expect(CACHE_KEYS.news('bbc')).toBe('news:bbc');
    });

    it('should generate video keys correctly', () => {
      expect(CACHE_KEYS.videos()).toBe('videos:spurs-women');
    });

    it('should generate podcast keys correctly', () => {
      expect(CACHE_KEYS.podcasts()).toBe('podcasts:spurs-related');
    });

    it('should generate stadium keys correctly', () => {
      expect(CACHE_KEYS.stadium('tottenham-hotspur-stadium')).toBe('stadium:tottenham-hotspur-stadium');
    });

    it('should generate stadium name keys correctly', () => {
      expect(CACHE_KEYS.stadiumNames('stadium-123')).toBe('stadium-names:stadium-123');
    });
  });

  describe('createCachedFunction', () => {
    let mockFn: jest.Mock;
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      mockFn = jest.fn();
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should create a cached function', () => {
      mockFn.mockResolvedValue('test-result');
      const options: CacheOptions = {
        keyParts: ['test', 'key'],
        tags: [CACHE_TAGS.MATCHES],
        ttl: 'STATIC_CONTENT'
      };

      const cachedFn = createCachedFunction(mockFn, options);
      expect(typeof cachedFn).toBe('function');
    });

    it('should call the original function', async () => {
      mockFn.mockResolvedValue('test-result');
      const options: CacheOptions = {
        keyParts: ['test', 'key'],
        tags: [CACHE_TAGS.MATCHES],
        ttl: 'STATIC_CONTENT'
      };

      const cachedFn = createCachedFunction(mockFn, options);
      const result = await cachedFn();

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('test-result');
    });

    it('should handle errors and throw CacheError when both cache and fallback fail', async () => {
      const error = new Error('Test error');
      mockFn.mockRejectedValue(error);
      const options: CacheOptions = {
        keyParts: ['test', 'key'],
        tags: [CACHE_TAGS.MATCHES],
        ttl: 'STATIC_CONTENT'
      };

      const cachedFn = createCachedFunction(mockFn, options);

      await expect(cachedFn()).rejects.toThrow(CacheError);
      await expect(cachedFn()).rejects.toThrow('Both cache and direct fetch failed');
    });


    it('should use default revalidate time when not specified', async () => {
      mockFn.mockResolvedValue('test-result');
      const options: CacheOptions = {
        keyParts: ['test', 'key'],
        tags: [CACHE_TAGS.MATCHES]
      };

      const cachedFn = createCachedFunction(mockFn, options);
      await cachedFn();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should use custom revalidate time when specified', async () => {
      mockFn.mockResolvedValue('test-result');
      const options: CacheOptions = {
        keyParts: ['test', 'key'],
        tags: [CACHE_TAGS.MATCHES],
        revalidate: 300
      };

      const cachedFn = createCachedFunction(mockFn, options);
      await cachedFn();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle cache failure with successful fallback', async () => {
      mockFn.mockResolvedValueOnce('fallback-result').mockResolvedValueOnce('fallback-result');
      const options: CacheOptions = {
        keyParts: ['test', 'key'],
        tags: [CACHE_TAGS.MATCHES],
        ttl: 'STATIC_CONTENT'
      };

      const cachedFn = createCachedFunction(mockFn, options);
      const result = await cachedFn();

      expect(result).toBe('fallback-result');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error objects in fallback', async () => {
      mockFn.mockRejectedValueOnce('string error').mockResolvedValueOnce('fallback-result');
      const options: CacheOptions = {
        keyParts: ['test', 'key'],
        tags: [CACHE_TAGS.MATCHES],
        ttl: 'STATIC_CONTENT'
      };

      const cachedFn = createCachedFunction(mockFn, options);
      const result = await cachedFn();

      expect(result).toBe('fallback-result');
    });
  });
});
