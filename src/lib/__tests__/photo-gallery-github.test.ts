import { galleryFileExists, commitFileToGallery } from '../photo-gallery-github';

function jsonResponse(body: unknown, ok = true, status = 200, statusText = 'OK') {
  return {
    ok,
    status,
    statusText,
    json: async () => body,
  } as Response;
}

describe('photo-gallery-github', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, GITHUB_TOKEN: 'test-token' };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.restoreAllMocks();
  });

  describe('galleryFileExists', () => {
    it('returns false for a 404 response', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse({}, false, 404, 'Not Found'));
      await expect(galleryFileExists('2025-26/some-folder/photo.webp')).resolves.toBe(false);
    });

    it('returns true when the file is found', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse({ sha: 'abc' }));
      await expect(galleryFileExists('2025-26/some-folder/photo.webp')).resolves.toBe(true);
    });

    it('throws for a non-404 error response', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse({}, false, 500, 'Server Error'));
      await expect(galleryFileExists('2025-26/some-folder/photo.webp')).rejects.toThrow(/GitHub API error/);
    });

    it('throws if GITHUB_TOKEN is not configured', async () => {
      delete process.env.GITHUB_TOKEN;
      await expect(galleryFileExists('2025-26/some-folder/photo.webp')).rejects.toThrow(/GITHUB_TOKEN/);
    });
  });

  describe('commitFileToGallery', () => {
    it('commits the file and returns the html_url/sha on success', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        jsonResponse({ content: { html_url: 'https://github.com/x', sha: 'def' } })
      );

      const result = await commitFileToGallery('2025-26/folder/photo.webp', 'base64content', 'Add photo');

      expect(result).toEqual({ htmlUrl: 'https://github.com/x', sha: 'def' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/contents/2025-26/folder/photo.webp'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('throws with response details on failure', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse({ message: 'nope' }, false, 422, 'Unprocessable'));

      await expect(commitFileToGallery('2025-26/folder/photo.webp', 'base64content', 'Add photo')).rejects.toThrow(
        /GitHub API error committing/
      );
    });
  });
});
