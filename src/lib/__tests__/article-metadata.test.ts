import { fetchFavicon, fetchArticleMetadata, fetchMultipleArticleMetadata } from '../article-metadata';

function jsonOk() {
  return { ok: true } as Response;
}
function jsonNotOk() {
  return { ok: false } as Response;
}

describe('fetchFavicon', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the Google favicon service URL when the Google HEAD request succeeds', async () => {
    fetchMock.mockResolvedValueOnce(jsonOk());

    const result = await fetchFavicon('https://example.com/article');

    expect(result).toBe('https://www.google.com/s2/favicons?domain=https://example.com&sz=32');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://www.google.com/s2/favicons?domain=https://example.com&sz=32',
      { method: 'HEAD' }
    );
  });

  it('falls through to the first fallback path that responds ok when Google is not ok', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonNotOk()) // google
      .mockResolvedValueOnce(jsonOk()); // favicon.ico

    const result = await fetchFavicon('https://example.com/article');

    expect(result).toBe('https://example.com/favicon.ico');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls through to the first fallback path that responds ok when Google throws', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('network down')) // google throws
      .mockResolvedValueOnce(jsonNotOk()) // favicon.ico not ok
      .mockResolvedValueOnce(jsonOk()); // favicon.png ok

    const result = await fetchFavicon('https://example.com/article');

    expect(result).toBe('https://example.com/favicon.png');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('tries all three fallback paths in order before giving up', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('google down'))
      .mockResolvedValueOnce(jsonNotOk()) // favicon.ico
      .mockRejectedValueOnce(new Error('favicon.png down')) // favicon.png throws
      .mockResolvedValueOnce(jsonOk()); // apple-touch-icon.png

    const result = await fetchFavicon('https://example.com/article');

    expect(result).toBe('https://example.com/apple-touch-icon.png');
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://example.com/favicon.ico', { method: 'HEAD' });
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'https://example.com/favicon.png', { method: 'HEAD' });
    expect(fetchMock).toHaveBeenNthCalledWith(4, 'https://example.com/apple-touch-icon.png', { method: 'HEAD' });
  });

  it('returns null when Google and every fallback path fail', async () => {
    fetchMock.mockRejectedValue(new Error('always fails'));

    const result = await fetchFavicon('https://example.com/article');

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(4); // google + 3 fallbacks
  });

  it('returns null for a malformed URL without making any fetch calls', async () => {
    const result = await fetchFavicon('not-a-valid-url');

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('fetchArticleMetadata', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(jsonOk());
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns favicon and a www.-stripped siteName for a URL with a www. prefix', async () => {
    const result = await fetchArticleMetadata('https://www.example.com/article');

    expect(result).toEqual({
      favicon: 'https://www.google.com/s2/favicons?domain=https://www.example.com&sz=32',
      title: undefined,
      siteName: 'example.com',
    });
  });

  it('leaves the hostname as-is when there is no www. prefix', async () => {
    const result = await fetchArticleMetadata('https://news.example.com/article');

    expect(result?.siteName).toBe('news.example.com');
  });

  it('omits the favicon field when no favicon could be found', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonNotOk());

    const result = await fetchArticleMetadata('https://example.com/article');

    expect(result?.favicon).toBeUndefined();
    expect(result?.siteName).toBe('example.com');
  });

  it('returns an object with every field undefined for a malformed URL (parse error is caught internally, not surfaced as null)', async () => {
    const result = await fetchArticleMetadata('not-a-valid-url');

    expect(result).toEqual({ favicon: undefined, title: undefined, siteName: undefined });
  });
});

describe('fetchMultipleArticleMetadata', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns a Map keyed by URL for each successfully resolved article', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonOk());
    const urls = ['https://example.com/a', 'https://other.com/b'];

    const resultPromise = fetchMultipleArticleMetadata(urls);
    await jest.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.size).toBe(2);
    expect(result.get('https://example.com/a')?.siteName).toBe('example.com');
    expect(result.get('https://other.com/b')?.siteName).toBe('other.com');
  });

  it('does not reject and simply omits a URL whose fetch rejects unexpectedly', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Simulate fetchArticleMetadata itself throwing by making fetch throw
    // synchronously in a way that escapes fetchFavicon's inner catch: here we
    // just confirm the batch as a whole never rejects even under total fetch
    // failure, and still returns metadata (article-metadata always resolves
    // per-URL rather than throwing - see fetchArticleMetadata tests above).
    global.fetch = jest.fn().mockRejectedValue(new Error('down'));
    const urls = ['https://example.com/a'];

    const resultPromise = fetchMultipleArticleMetadata(urls);
    await jest.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.size).toBe(1);
    expect(result.get('https://example.com/a')).toEqual({
      favicon: undefined,
      title: undefined,
      siteName: 'example.com',
    });
  });

  it('staggers requests with an index * 100ms delay before each fetch starts', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonOk());
    const urls = ['https://example.com/a', 'https://example.com/b'];

    fetchMultipleArticleMetadata(urls);
    // Nothing should have started fetching yet for the second URL immediately.
    await Promise.resolve();
    const callsBeforeDelay = (global.fetch as jest.Mock).mock.calls.length;

    await jest.advanceTimersByTimeAsync(250);
    const callsAfterDelay = (global.fetch as jest.Mock).mock.calls.length;

    expect(callsAfterDelay).toBeGreaterThan(callsBeforeDelay);
  });
});
