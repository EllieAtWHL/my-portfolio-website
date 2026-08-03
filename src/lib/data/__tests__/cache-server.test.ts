import { describe, it, expect, beforeEach } from '@jest/globals';

const mockRevalidateTag = jest.fn();

jest.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}));

import { revalidateCacheTag, revalidateCacheTags, revalidateAllCache } from '../cache-server';
import { CACHE_TAGS } from '../cache-utils';

describe('cache-server', () => {
  beforeEach(() => {
    mockRevalidateTag.mockClear();
  });

  describe('revalidateCacheTag', () => {
    it('calls next/cache revalidateTag with the tag and an empty options object', () => {
      revalidateCacheTag('matches');

      expect(mockRevalidateTag).toHaveBeenCalledTimes(1);
      expect(mockRevalidateTag).toHaveBeenCalledWith('matches', {});
    });
  });

  describe('revalidateCacheTags', () => {
    it('calls revalidateTag once per tag, each with an empty options object', () => {
      revalidateCacheTags(['matches', 'seasons', 'news']);

      expect(mockRevalidateTag).toHaveBeenCalledTimes(3);
      expect(mockRevalidateTag).toHaveBeenNthCalledWith(1, 'matches', {});
      expect(mockRevalidateTag).toHaveBeenNthCalledWith(2, 'seasons', {});
      expect(mockRevalidateTag).toHaveBeenNthCalledWith(3, 'news', {});
    });

    it('does not call revalidateTag when given an empty array', () => {
      revalidateCacheTags([]);
      expect(mockRevalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('revalidateAllCache', () => {
    it('revalidates every tag in CACHE_TAGS and returns the full list', () => {
      const result = revalidateAllCache();

      const expectedTags = Object.values(CACHE_TAGS);
      expect(result).toEqual(expectedTags);
      expect(mockRevalidateTag).toHaveBeenCalledTimes(expectedTags.length);
      for (const tag of expectedTags) {
        expect(mockRevalidateTag).toHaveBeenCalledWith(tag, {});
      }
    });
  });
});
