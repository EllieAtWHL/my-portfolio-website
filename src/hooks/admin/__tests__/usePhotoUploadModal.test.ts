import { renderHook, act, waitFor } from '@testing-library/react';
import { usePhotoUploadModal } from '../usePhotoUploadModal';
import { compressImageForUpload } from '@/lib/image-compression';

jest.mock('@/lib/image-compression', () => ({
  compressImageForUpload: jest.fn(async (file: File) => file),
}));

const mockCompress = compressImageForUpload as jest.Mock;

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
      usePhotoUploadModal({ editingMatchId: 'match-1', refreshRelatedMedia, showMessage })
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

  it('processes multiple photos sequentially and isolates a single failure', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(jsonResponse({ data: { optimisedSizeBytes: 100 }, success: true }))
      .mockResolvedValueOnce(jsonResponse({ error: 'boom' }, false))
      .mockResolvedValueOnce(jsonResponse({ data: { optimisedSizeBytes: 200 }, success: true }));

    const { result } = renderHook(() =>
      usePhotoUploadModal({ editingMatchId: 'match-1', refreshRelatedMedia, showMessage })
    );

    act(() => {
      result.current.addFiles([makeFile('a.jpg'), makeFile('b.jpg'), makeFile('c.jpg')] as unknown as FileList);
    });

    await waitFor(() => {
      expect(result.current.photoQueue.every((item) => item.status === 'done' || item.status === 'error')).toBe(true);
    });

    expect(result.current.photoQueue.map((item) => item.status)).toEqual(['done', 'error', 'done']);
    expect(result.current.photoQueue[1].error).toBe('boom');
  });

  it('retries a failed photo and can succeed the second time', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'network drop' }, false))
      .mockResolvedValueOnce(jsonResponse({ data: { optimisedSizeBytes: 50 }, success: true }));

    const { result } = renderHook(() =>
      usePhotoUploadModal({ editingMatchId: 'match-1', refreshRelatedMedia, showMessage })
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
      usePhotoUploadModal({ editingMatchId: null, refreshRelatedMedia, showMessage })
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
      usePhotoUploadModal({ editingMatchId: 'match-1', refreshRelatedMedia, showMessage })
    );

    act(() => {
      result.current.addFiles([]);
      result.current.closePhotoUploadModal();
    });

    expect(showMessage).not.toHaveBeenCalled();
  });
});
