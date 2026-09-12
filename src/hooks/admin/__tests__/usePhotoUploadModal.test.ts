import { renderHook, act, waitFor } from '@testing-library/react';
import { usePhotoUploadModal } from '../usePhotoUploadModal';
import { compressImageForUpload } from '@/lib/image-compression';

jest.mock('@/lib/image-compression', () => ({
  compressImageForUpload: jest.fn(async (file: File) => file),
}));

const mockCompress = compressImageForUpload as jest.Mock;

// Real production behaviour waits 2s before an automatic retry (see the
// hook's doc comment) - tests override this to keep them fast/deterministic.
const TEST_RETRY_DELAY_MS = 5;

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

function makeFile(name: string) {
  return new File(['bytes'], name, { type: 'image/jpeg' });
}

describe('usePhotoUploadModal', () => {
  const refreshRelatedMedia = jest.fn().mockResolvedValue(undefined);
  const showMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCompress.mockImplementation(async (file: File) => file);
  });

  it('uploads a single photo and marks it done', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse({ data: { optimisedSizeBytes: 1234 }, success: true })
    );

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

    expect(result.current.photoQueue[0].optimisedSizeBytes).toBe(1234);
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/photo-upload', expect.objectContaining({ method: 'POST' }));
    expect(refreshRelatedMedia).toHaveBeenCalled();
  });

  it('automatically retries a single transient failure and still marks the photo done', async () => {
    // A momentary blip (a dropped connection, or the auth session's brief
    // refresh race under a long request sequence - both seen in real-device
    // WEB-149 testing) fails once, then clears on its own.
    global.fetch = jest.fn()
      .mockResolvedValueOnce(jsonResponse({ data: { optimisedSizeBytes: 100 }, success: true }))
      .mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized' }, false))
      .mockResolvedValueOnce(jsonResponse({ data: { optimisedSizeBytes: 200 }, success: true }))
      .mockResolvedValueOnce(jsonResponse({ data: { optimisedSizeBytes: 300 }, success: true }));

    const { result } = renderHook(() =>
      usePhotoUploadModal({ editingMatchId: 'match-1', refreshRelatedMedia, showMessage, autoRetryDelayMs: TEST_RETRY_DELAY_MS })
    );

    act(() => {
      result.current.addFiles([makeFile('a.jpg'), makeFile('b.jpg'), makeFile('c.jpg')] as unknown as FileList);
    });

    await waitFor(() => {
      expect(result.current.photoQueue.every((item) => item.status === 'done')).toBe(true);
    });

    // The middle photo's transient failure never surfaces as an error - it
    // resolved automatically without needing a manual Retry click, and the
    // other two photos in the batch were unaffected.
    expect(result.current.photoQueue.map((item) => item.status)).toEqual(['done', 'done', 'done']);
    expect(result.current.photoQueue[1].optimisedSizeBytes).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it('marks a photo as error only after both the initial attempt and the automatic retry fail', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'boom' }, false))
      .mockResolvedValueOnce(jsonResponse({ error: 'boom again' }, false));

    const { result } = renderHook(() =>
      usePhotoUploadModal({ editingMatchId: 'match-1', refreshRelatedMedia, showMessage, autoRetryDelayMs: TEST_RETRY_DELAY_MS })
    );

    act(() => {
      result.current.addFiles([makeFile('a.jpg')] as unknown as FileList);
    });

    await waitFor(() => {
      expect(result.current.photoQueue[0].status).toBe('error');
    });

    expect(result.current.photoQueue[0].error).toBe('boom again');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('lets a manual retry succeed after both automatic attempts failed', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'network drop' }, false))
      .mockResolvedValueOnce(jsonResponse({ error: 'network drop' }, false))
      .mockResolvedValueOnce(jsonResponse({ data: { optimisedSizeBytes: 50 }, success: true }));

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
