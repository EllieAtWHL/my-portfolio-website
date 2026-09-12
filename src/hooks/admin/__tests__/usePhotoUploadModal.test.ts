import { renderHook, act, waitFor } from '@testing-library/react';
import { usePhotoUploadModal } from '../usePhotoUploadModal';
import { compressImageForUpload } from '@/lib/image-compression';

jest.mock('@/lib/image-compression', () => ({
  compressImageForUpload: jest.fn(async (file: File) => ({ file, compressed: true })),
}));

const mockCompress = compressImageForUpload as jest.Mock;

// Real production behaviour waits 2s before an automatic retry (see the
// hook's doc comment) - tests override this to keep them fast/deterministic.
const TEST_RETRY_DELAY_MS = 5;

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

function uploadSuccess(path: string, blobSha: string, optimisedSizeBytes: number) {
  return jsonResponse({ data: { path, blobSha, optimisedSizeBytes }, success: true });
}

function finalizeSuccess() {
  return jsonResponse({ data: { skipped: false, photoCount: 1 }, success: true });
}

function makeFile(name: string) {
  return new File(['bytes'], name, { type: 'image/jpeg' });
}

/** Routes mocked fetch calls by URL: photo-upload vs finalize get separate response queues. */
function mockFetchRouter(uploadResponses: Response[], finalizeResponses: Response[]) {
  let uploadIndex = 0;
  let finalizeIndex = 0;
  global.fetch = jest.fn((url: string) => {
    if (url === '/api/admin/photo-upload/finalize') {
      return Promise.resolve(finalizeResponses[Math.min(finalizeIndex++, finalizeResponses.length - 1)]);
    }
    return Promise.resolve(uploadResponses[Math.min(uploadIndex++, uploadResponses.length - 1)]);
  }) as unknown as typeof fetch;
}

describe('usePhotoUploadModal', () => {
  const refreshRelatedMedia = jest.fn().mockResolvedValue(undefined);
  const showMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCompress.mockImplementation(async (file: File) => ({ file, compressed: true }));
  });

  it('uploads a single photo, marks it done, and publishes it via finalize', async () => {
    mockFetchRouter([uploadSuccess('folder/a.webp', 'sha-a', 1234)], [finalizeSuccess()]);

    const { result } = renderHook(() =>
      usePhotoUploadModal({ editingMatchId: 'match-1', refreshRelatedMedia, showMessage, autoRetryDelayMs: TEST_RETRY_DELAY_MS })
    );

    act(() => {
      result.current.openPhotoUploadModal();
    });

    act(() => {
      result.current.addFiles([makeFile('a.jpg')] as unknown as FileList);
    });

    await waitFor(() => {
      expect(result.current.photoQueue[0].status).toBe('done');
    });

    await waitFor(() => {
      expect(result.current.finalizeStatus).toBe('idle');
    });

    expect(result.current.photoQueue[0].optimisedSizeBytes).toBe(1234);
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/photo-upload', expect.objectContaining({ method: 'POST' }));
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/photo-upload/finalize', expect.objectContaining({ method: 'POST' }));
    expect(refreshRelatedMedia).toHaveBeenCalled();
  });

  it('finalizes once for the whole batch, not once per photo', async () => {
    mockFetchRouter(
      [
        uploadSuccess('folder/a.webp', 'sha-a', 100),
        uploadSuccess('folder/b.webp', 'sha-b', 200),
        uploadSuccess('folder/c.webp', 'sha-c', 300),
      ],
      [finalizeSuccess()]
    );

    const { result } = renderHook(() =>
      usePhotoUploadModal({ editingMatchId: 'match-1', refreshRelatedMedia, showMessage, autoRetryDelayMs: TEST_RETRY_DELAY_MS })
    );

    act(() => {
      result.current.addFiles([makeFile('a.jpg'), makeFile('b.jpg'), makeFile('c.jpg')] as unknown as FileList);
    });

    await waitFor(() => {
      expect(result.current.photoQueue.every((item) => item.status === 'done')).toBe(true);
    });
    await waitFor(() => {
      expect(result.current.finalizeStatus).toBe('idle');
    });

    const finalizeCalls = (global.fetch as jest.Mock).mock.calls.filter(([url]) => url === '/api/admin/photo-upload/finalize');
    expect(finalizeCalls).toHaveLength(1);
    const finalizeBody = JSON.parse(finalizeCalls[0][1].body);
    expect(finalizeBody.blobs).toEqual([
      { path: 'folder/a.webp', sha: 'sha-a' },
      { path: 'folder/b.webp', sha: 'sha-b' },
      { path: 'folder/c.webp', sha: 'sha-c' },
    ]);
  });

  it('surfaces a finalize failure without losing the already-uploaded photos, and allows a manual retry', async () => {
    mockFetchRouter(
      [uploadSuccess('folder/a.webp', 'sha-a', 100)],
      [
        jsonResponse({ error: 'boom' }, false),
        jsonResponse({ error: 'boom' }, false),
        finalizeSuccess(),
      ]
    );

    const { result } = renderHook(() =>
      usePhotoUploadModal({ editingMatchId: 'match-1', refreshRelatedMedia, showMessage, autoRetryDelayMs: TEST_RETRY_DELAY_MS })
    );

    act(() => {
      result.current.addFiles([makeFile('a.jpg')] as unknown as FileList);
    });

    await waitFor(() => {
      expect(result.current.finalizeStatus).toBe('error');
    });

    expect(result.current.photoQueue[0].status).toBe('done');
    expect(result.current.finalizeError).toBe('boom');

    act(() => {
      result.current.retryFinalize();
    });

    await waitFor(() => {
      expect(result.current.finalizeStatus).toBe('idle');
    });
    expect(refreshRelatedMedia).toHaveBeenCalled();
  });

  it('automatically retries a single transient upload failure and still marks the photo done', async () => {
    mockFetchRouter(
      [
        jsonResponse({ error: 'Unauthorized' }, false),
        uploadSuccess('folder/a.webp', 'sha-a', 200),
      ],
      [finalizeSuccess()]
    );

    const { result } = renderHook(() =>
      usePhotoUploadModal({ editingMatchId: 'match-1', refreshRelatedMedia, showMessage, autoRetryDelayMs: TEST_RETRY_DELAY_MS })
    );

    act(() => {
      result.current.addFiles([makeFile('a.jpg')] as unknown as FileList);
    });

    await waitFor(() => {
      expect(result.current.photoQueue[0].status).toBe('done');
    });
    expect(result.current.photoQueue[0].optimisedSizeBytes).toBe(200);
  });

  it('marks a photo as error only after both the initial attempt and the automatic retry fail', async () => {
    mockFetchRouter(
      [jsonResponse({ error: 'boom' }, false), jsonResponse({ error: 'boom again' }, false)],
      []
    );

    const { result } = renderHook(() =>
      usePhotoUploadModal({ editingMatchId: 'match-1', refreshRelatedMedia, showMessage, autoRetryDelayMs: TEST_RETRY_DELAY_MS })
    );

    act(() => {
      result.current.addFiles([makeFile('a.jpg')] as unknown as FileList);
    });

    await waitFor(() => {
      expect(result.current.photoQueue[0].status).toBe('error');
    });

    expect(result.current.photoQueue[0].error).toContain('boom again');
    // Nothing succeeded, so finalize should never have been called.
    expect(global.fetch).not.toHaveBeenCalledWith('/api/admin/photo-upload/finalize', expect.anything());
  });

  it('includes compression-fallback diagnostics in the error when a "Failed to fetch" never reaches the server', async () => {
    // A "Failed to fetch" gives no server-side trace to diagnose from (see
    // WEB-149 findings), so the error message itself needs to carry what
    // was actually attempted - specifically, whether compression silently
    // fell back to the uncompressed original.
    mockCompress.mockImplementation(async (file: File) => ({ file, compressed: false, fallbackReason: 'decode failed' }));
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() =>
      usePhotoUploadModal({ editingMatchId: 'match-1', refreshRelatedMedia, showMessage, autoRetryDelayMs: TEST_RETRY_DELAY_MS })
    );

    act(() => {
      result.current.addFiles([makeFile('a.jpg')] as unknown as FileList);
    });

    await waitFor(() => {
      expect(result.current.photoQueue[0].status).toBe('error');
    });

    expect(result.current.photoQueue[0].error).toContain('Failed to fetch');
    expect(result.current.photoQueue[0].error).toContain('UNCOMPRESSED');
    expect(result.current.photoQueue[0].error).toContain('decode failed');
  });

  it('lets a manual retry succeed after both automatic upload attempts failed', async () => {
    mockFetchRouter(
      [
        jsonResponse({ error: 'network drop' }, false),
        jsonResponse({ error: 'network drop' }, false),
        uploadSuccess('folder/a.webp', 'sha-a', 50),
      ],
      [finalizeSuccess()]
    );

    const { result } = renderHook(() =>
      usePhotoUploadModal({ editingMatchId: 'match-1', refreshRelatedMedia, showMessage, autoRetryDelayMs: TEST_RETRY_DELAY_MS })
    );

    act(() => {
      result.current.addFiles([makeFile('a.jpg')] as unknown as FileList);
    });

    await waitFor(() => {
      expect(result.current.photoQueue[0].status).toBe('error');
    });

    const failedId = result.current.photoQueue[0].id;
    act(() => {
      result.current.retryItem(failedId);
    });

    await waitFor(() => {
      expect(result.current.photoQueue[0].status).toBe('done');
    });
  });

  it('fails fast without calling the API if no match is being edited', async () => {
    global.fetch = jest.fn();

    const { result } = renderHook(() =>
      usePhotoUploadModal({ editingMatchId: null, refreshRelatedMedia, showMessage, autoRetryDelayMs: TEST_RETRY_DELAY_MS })
    );

    act(() => {
      result.current.addFiles([makeFile('a.jpg')] as unknown as FileList);
    });

    await waitFor(() => {
      expect(result.current.photoQueue[0].status).toBe('error');
    });

    expect(result.current.photoQueue[0].error).toBe('No match selected');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('closePhotoUploadModal warns about any remaining failed uploads', () => {
    const { result } = renderHook(() =>
      usePhotoUploadModal({ editingMatchId: 'match-1', refreshRelatedMedia, showMessage, autoRetryDelayMs: TEST_RETRY_DELAY_MS })
    );

    act(() => {
      result.current.addFiles([]);
      result.current.closePhotoUploadModal();
    });

    expect(showMessage).not.toHaveBeenCalled();
  });
});
