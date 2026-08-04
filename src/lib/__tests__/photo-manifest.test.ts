import { fetchPhotoManifest, isPhotoManifestAvailable, getFolderPhotos } from '../photo-manifest';

describe('fetchPhotoManifest', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the parsed JSON manifest when the response is ok', async () => {
    const manifest = { 'folder-a': ['a.jpg', 'b.jpg'] };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => manifest });

    const result = await fetchPhotoManifest();

    expect(result).toEqual(manifest);
    expect(global.fetch).toHaveBeenCalledWith('/spurs-women/photo-gallery.manifest.json');
  });

  it('returns an empty object and warns when the response is not ok', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });

    const result = await fetchPhotoManifest();

    expect(result).toEqual({});
    expect(warnSpy).toHaveBeenCalled();
  });

  it('returns an empty object and logs an error when fetch throws', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const result = await fetchPhotoManifest();

    expect(result).toEqual({});
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe('isPhotoManifestAvailable', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true when the HEAD request is ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const result = await isPhotoManifestAvailable();

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/spurs-women/photo-gallery.manifest.json', { method: 'HEAD' });
  });

  it('returns false when the HEAD request is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    const result = await isPhotoManifestAvailable();

    expect(result).toBe(false);
  });

  it('returns false when the HEAD request throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const result = await isPhotoManifestAvailable();

    expect(result).toBe(false);
  });
});

describe('getFolderPhotos', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the photo array for an existing folder key', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ 'folder-a': ['a.jpg', 'b.jpg'], 'folder-b': ['c.jpg'] }),
    });

    const result = await getFolderPhotos('folder-a');

    expect(result).toEqual(['a.jpg', 'b.jpg']);
  });

  it('returns an empty array for a missing folder key', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ 'folder-a': ['a.jpg'] }),
    });

    const result = await getFolderPhotos('does-not-exist');

    expect(result).toEqual([]);
  });
});
