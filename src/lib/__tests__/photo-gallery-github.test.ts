import { createBlob, finalizeGalleryBatch } from '../photo-gallery-github';

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

  describe('createBlob', () => {
    it('returns the blob sha on success', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse({ sha: 'blob-sha-1' }));

      await expect(createBlob('base64content')).resolves.toBe('blob-sha-1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/git/blobs'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('throws with response details on failure', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse({ message: 'nope' }, false, 422, 'Unprocessable'));

      await expect(createBlob('base64content')).rejects.toThrow(/GitHub API error/);
    });

    it('throws if GITHUB_TOKEN is not configured', async () => {
      delete process.env.GITHUB_TOKEN;
      await expect(createBlob('base64content')).rejects.toThrow(/GITHUB_TOKEN/);
    });
  });

  describe('finalizeGalleryBatch', () => {
    function mockGithubSequence({ headSha, treeSha, newTreeSha, newCommitSha }: { headSha: string; treeSha: string; newTreeSha: string; newCommitSha?: string }) {
      const fetchMock = jest.fn()
        .mockResolvedValueOnce(jsonResponse({ object: { sha: headSha } })) // GET ref
        .mockResolvedValueOnce(jsonResponse({ tree: { sha: treeSha } })) // GET commit
        .mockResolvedValueOnce(jsonResponse({ sha: newTreeSha })); // POST tree

      if (newCommitSha) {
        fetchMock
          .mockResolvedValueOnce(jsonResponse({ sha: newCommitSha })) // POST commit
          .mockResolvedValueOnce(jsonResponse({})); // PATCH ref
      }

      global.fetch = fetchMock;
      return fetchMock;
    }

    it('creates a tree, commit, and moves the ref when the tree actually changes', async () => {
      mockGithubSequence({ headSha: 'head-1', treeSha: 'tree-1', newTreeSha: 'tree-2', newCommitSha: 'commit-2' });

      const result = await finalizeGalleryBatch([{ path: 'a/b.webp', sha: 'blob-1' }], 'Add 1 photo');

      expect(result).toEqual({ skipped: false, commitSha: 'commit-2' });
      expect(global.fetch).toHaveBeenCalledTimes(5);
    });

    it('skips creating a commit when the resulting tree is unchanged (already published)', async () => {
      mockGithubSequence({ headSha: 'head-1', treeSha: 'tree-1', newTreeSha: 'tree-1' });

      const result = await finalizeGalleryBatch([{ path: 'a/b.webp', sha: 'blob-1' }], 'Add 1 photo');

      expect(result).toEqual({ skipped: true, commitSha: 'head-1' });
      // Only the ref/commit/tree reads plus the tree-diff POST - no commit or ref-update calls.
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('throws a clear, retryable error if the ref update fails (branch moved concurrently)', async () => {
      const fetchMock = mockGithubSequence({ headSha: 'head-1', treeSha: 'tree-1', newTreeSha: 'tree-2' });
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ sha: 'commit-2' })) // POST commit
        .mockResolvedValueOnce(jsonResponse({ message: 'conflict' }, false, 422, 'Unprocessable')); // PATCH ref fails

      await expect(finalizeGalleryBatch([{ path: 'a/b.webp', sha: 'blob-1' }], 'Add 1 photo')).rejects.toThrow(/moved concurrently/);
    });
  });
});
