import {
  fetchYouTubeMetadata,
  getBasicYouTubeMetadata,
  fetchMultipleYouTubeMetadata,
} from '../youtube';
import type { Media } from '@/types/media';

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    statusText: ok ? 'OK' : 'Not Found',
    json: async () => body,
  } as Response;
}

describe('extractVideoId (via fetchYouTubeMetadata / getBasicYouTubeMetadata)', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({}));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('extracts the id from a watch?v= URL', () => {
    const result = getBasicYouTubeMetadata('https://www.youtube.com/watch?v=abc12345678');
    expect(result?.videoId).toBe('abc12345678');
  });

  it('extracts the id from a watch?v= URL with trailing query params', () => {
    const result = getBasicYouTubeMetadata('https://www.youtube.com/watch?v=abc12345678&t=30s');
    expect(result?.videoId).toBe('abc12345678');
  });

  it('extracts the id from a youtu.be short URL', () => {
    const result = getBasicYouTubeMetadata('https://youtu.be/abc12345678');
    expect(result?.videoId).toBe('abc12345678');
  });

  it('extracts the id from an embed URL', () => {
    const result = getBasicYouTubeMetadata('https://www.youtube.com/embed/abc12345678');
    expect(result?.videoId).toBe('abc12345678');
  });

  it('extracts the id from a shorts URL', () => {
    const result = getBasicYouTubeMetadata('https://www.youtube.com/shorts/abc12345678');
    expect(result?.videoId).toBe('abc12345678');
  });

  it('returns null for a URL that is not a recognised YouTube format', () => {
    const result = getBasicYouTubeMetadata('https://example.com/not-youtube');
    expect(result).toBeNull();
  });
});

describe('getBasicYouTubeMetadata', () => {
  it('builds fallback metadata using the caption as title when provided', () => {
    const result = getBasicYouTubeMetadata('https://youtu.be/abc12345678', 'My Caption');
    expect(result).toEqual({
      title: 'My Caption',
      channelName: 'YouTube',
      thumbnail: 'https://img.youtube.com/vi/abc12345678/hqdefault.jpg',
      videoId: 'abc12345678',
    });
  });

  it('falls back to a generated title when no caption is provided', () => {
    const result = getBasicYouTubeMetadata('https://youtu.be/abc12345678');
    expect(result?.title).toBe('YouTube Video: abc12345678');
  });

  it('falls back to a generated title when caption is null', () => {
    const result = getBasicYouTubeMetadata('https://youtu.be/abc12345678', null);
    expect(result?.title).toBe('YouTube Video: abc12345678');
  });

  it('returns null for an invalid URL regardless of caption', () => {
    expect(getBasicYouTubeMetadata('not-a-youtube-url', 'Caption')).toBeNull();
  });
});

describe('fetchYouTubeMetadata', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns null immediately for an invalid URL without calling fetch', async () => {
    const result = await fetchYouTubeMetadata('https://example.com/not-youtube');

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns full metadata composed from the oEmbed response plus a computed thumbnail URL', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ title: 'Great Goal', author_name: 'Spurs Women' })) // oembed
      .mockResolvedValueOnce(jsonResponse({ publish_date: '2025-01-01T00:00:00Z' })); // noembed

    const result = await fetchYouTubeMetadata('https://www.youtube.com/watch?v=abc12345678');

    expect(result).toEqual({
      title: 'Great Goal',
      channelName: 'Spurs Women',
      thumbnail: 'https://img.youtube.com/vi/abc12345678/hqdefault.jpg',
      videoId: 'abc12345678',
      publishDate: '2025-01-01T00:00:00Z',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=abc12345678&format=json'
    );
  });

  it('falls back to a generated title/channel when the oEmbed payload omits them', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({})) // oembed with no title/author
      .mockResolvedValueOnce(jsonResponse({})); // noembed with no publish_date

    const result = await fetchYouTubeMetadata('https://www.youtube.com/watch?v=abc12345678');

    expect(result?.title).toBe('YouTube Video: abc12345678');
    expect(result?.channelName).toBe('Unknown Channel');
    expect(result?.publishDate).toBeUndefined();
  });

  it('returns null when the oEmbed request is not ok', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, false));

    const result = await fetchYouTubeMetadata('https://www.youtube.com/watch?v=abc12345678');

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null when the oEmbed fetch throws', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    const result = await fetchYouTubeMetadata('https://www.youtube.com/watch?v=abc12345678');

    expect(result).toBeNull();
  });

  it('still returns oEmbed metadata (without a publish date) when the noembed request fails', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ title: 'Great Goal', author_name: 'Spurs Women' })) // oembed ok
      .mockRejectedValueOnce(new Error('noembed down')); // noembed throws

    const result = await fetchYouTubeMetadata('https://www.youtube.com/watch?v=abc12345678');

    expect(result?.title).toBe('Great Goal');
    expect(result?.publishDate).toBeUndefined();
  });

  it('still returns oEmbed metadata when the noembed request is not ok', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ title: 'Great Goal', author_name: 'Spurs Women' }))
      .mockResolvedValueOnce(jsonResponse({}, false));

    const result = await fetchYouTubeMetadata('https://www.youtube.com/watch?v=abc12345678');

    expect(result?.title).toBe('Great Goal');
    expect(result?.publishDate).toBeUndefined();
  });
});

describe('fetchMultipleYouTubeMetadata', () => {
  const videoA: Media = { id: 1, type: 'video-external', url: 'https://youtu.be/aaaaaaaaaaa', caption: 'Caption A' };
  const videoB: Media = { id: 2, type: 'video-external', url: 'https://youtu.be/bbbbbbbbbbb', caption: 'Caption B' };

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a Map keyed by video URL using full oEmbed metadata when the fetch succeeds', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ title: 'Real Title', author_name: 'Channel' }));

    const result = await fetchMultipleYouTubeMetadata([videoA]);

    expect(result.get('https://youtu.be/aaaaaaaaaaa')).toEqual({
      title: 'Real Title',
      channelName: 'Channel',
      thumbnail: 'https://img.youtube.com/vi/aaaaaaaaaaa/hqdefault.jpg',
      videoId: 'aaaaaaaaaaa',
      publishDate: undefined,
    });
  });

  it('falls back to basic metadata (using the caption) when the oEmbed fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('down'));

    const result = await fetchMultipleYouTubeMetadata([videoA]);

    expect(result.get('https://youtu.be/aaaaaaaaaaa')).toEqual({
      title: 'Caption A',
      channelName: 'YouTube',
      thumbnail: 'https://img.youtube.com/vi/aaaaaaaaaaa/hqdefault.jpg',
      videoId: 'aaaaaaaaaaa',
    });
  });

  it('falls back to basic metadata when the oEmbed response is not ok (not a throw)', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({}, false));

    const result = await fetchMultipleYouTubeMetadata([videoA]);

    expect(result.get('https://youtu.be/aaaaaaaaaaa')?.title).toBe('Caption A');
  });

  it('handles multiple videos independently, keyed by their own URL', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ title: 'T', author_name: 'C' }));

    const result = await fetchMultipleYouTubeMetadata([videoA, videoB]);

    expect(result.size).toBe(2);
    expect(result.has('https://youtu.be/aaaaaaaaaaa')).toBe(true);
    expect(result.has('https://youtu.be/bbbbbbbbbbb')).toBe(true);
  });

  it('omits a video entirely when both the oEmbed fetch and the basic-metadata fallback fail (invalid URL)', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({}));
    const invalidVideo: Media = { id: 3, type: 'video-external', url: 'https://example.com/not-youtube', caption: null };

    const result = await fetchMultipleYouTubeMetadata([invalidVideo]);

    expect(result.has('https://example.com/not-youtube')).toBe(false);
    expect(result.size).toBe(0);
  });
});
