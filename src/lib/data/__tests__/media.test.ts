import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockSupabaseFrom } from '@/test-utils/supabase-query-mock';
import type { Media } from '@/lib/data/media';

function makeMedia(overrides: Partial<Media>): Media {
  return {
    id: 1,
    match_id: 1,
    type: 'photo',
    title: null,
    url: 'https://example.com/1.jpg',
    thumbnail_url: null,
    description: null,
    source: null,
    date: null,
    sort_order: 0,
    created_at: '2024-01-01T00:00:00.000Z',
    caption: null,
    ...overrides,
  };
}

const mixedMedia: Media[] = [
  makeMedia({ id: 1, type: 'photo' }),
  makeMedia({ id: 2, type: 'photo album' }),
  makeMedia({ id: 3, type: 'article' }),
  makeMedia({ id: 4, type: 'social media' }),
  makeMedia({ id: 5, type: 'video-external' }),
];

describe('media data layer', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('getMediaByMatch', () => {
    it('returns all media rows for a match on success', async () => {
      const mockFrom = mockSupabaseFrom({ media: { data: mixedMedia, error: null } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getMediaByMatch } = await import('@/lib/data/media');
      const result = await getMediaByMatch('1');

      expect(result).toEqual(mixedMedia);
      expect(mockFrom).toHaveBeenCalledWith('media');
    });

    it('returns [] (not throw) when the query errors', async () => {
      const mockFrom = mockSupabaseFrom({ media: { data: null, error: { message: 'db down' } } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getMediaByMatch } = await import('@/lib/data/media');
      const result = await getMediaByMatch('1');

      expect(result).toEqual([]);
    });
  });

  describe('type-filtered getters', () => {
    it('getPhotosByMatch returns only photo and photo album entries, in original order', async () => {
      const mockFrom = mockSupabaseFrom({ media: { data: mixedMedia, error: null } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getPhotosByMatch } = await import('@/lib/data/media');
      const result = await getPhotosByMatch('1');

      expect(result.map((m) => m.id)).toEqual([1, 2]);
      expect(result.every((m) => m.type === 'photo' || m.type === 'photo album')).toBe(true);
    });

    it('getArticlesByMatch returns only article entries', async () => {
      const mockFrom = mockSupabaseFrom({ media: { data: mixedMedia, error: null } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getArticlesByMatch } = await import('@/lib/data/media');
      const result = await getArticlesByMatch('1');

      expect(result.map((m) => m.id)).toEqual([3]);
    });

    it('getSocialMediaByMatch returns only social media entries', async () => {
      const mockFrom = mockSupabaseFrom({ media: { data: mixedMedia, error: null } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getSocialMediaByMatch } = await import('@/lib/data/media');
      const result = await getSocialMediaByMatch('1');

      expect(result.map((m) => m.id)).toEqual([4]);
    });

    it('getVideosByMatch returns only video-external entries', async () => {
      const mockFrom = mockSupabaseFrom({ media: { data: mixedMedia, error: null } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getVideosByMatch } = await import('@/lib/data/media');
      const result = await getVideosByMatch('1');

      expect(result.map((m) => m.id)).toEqual([5]);
    });

    it('each filtered getter returns [] when there are no matching entries', async () => {
      const onlyPhotos: Media[] = [makeMedia({ id: 1, type: 'photo' })];
      const mockFrom = mockSupabaseFrom({ media: { data: onlyPhotos, error: null } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getArticlesByMatch, getSocialMediaByMatch, getVideosByMatch } = await import('@/lib/data/media');

      expect(await getArticlesByMatch('1')).toEqual([]);
      expect(await getSocialMediaByMatch('1')).toEqual([]);
      expect(await getVideosByMatch('1')).toEqual([]);
    });

    it('filtered getters return [] when the underlying media query errors', async () => {
      const mockFrom = mockSupabaseFrom({ media: { data: null, error: { message: 'db down' } } });
      jest.doMock('@/utils/supabase', () => ({ supabase: { from: mockFrom } }));

      const { getPhotosByMatch } = await import('@/lib/data/media');
      const result = await getPhotosByMatch('1');

      expect(result).toEqual([]);
    });
  });
});
