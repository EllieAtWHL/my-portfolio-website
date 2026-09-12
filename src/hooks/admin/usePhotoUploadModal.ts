import { useCallback, useRef, useState } from 'react';
import { compressImageForUpload } from '@/lib/image-compression';

export type PhotoQueueItemStatus = 'queued' | 'compressing' | 'uploading' | 'done' | 'error';

export interface PhotoQueueItem {
  id: string;
  file: File;
  name: string;
  status: PhotoQueueItemStatus;
  error?: string;
  originalSizeBytes: number;
  optimisedSizeBytes?: number;
}

interface UsePhotoUploadModalArgs {
  editingMatchId: string | null;
  refreshRelatedMedia: () => Promise<void>;
  showMessage: (text: string, type: 'success' | 'error') => void;
}

/**
 * Manages the "upload match photos from this device" flow: a queue of
 * picked photos, each compressed client-side then POSTed individually to
 * /api/admin/photo-upload (one request per photo - see WEB-148/WEB-149
 * findings in reference/photo-gallery/README.md ("Adding photos from a phone") on why this
 * is per-photo rather than one batched request). Photos are processed
 * sequentially so a dropped connection only affects the one in flight, and
 * a Screen Wake Lock is held for the duration to reduce the chance of the
 * phone's screen lock suspending an in-flight upload.
 *
 * `queueRef` is the single source of truth for the queue; `photoQueue`
 * state is only a rendering snapshot of it, refreshed via `commit()`.
 * Deriving "the next queued item" from React state instead (e.g. via a
 * setState updater's return value) is tempting but wrong here: this loop
 * calls updateItem multiple times per photo across several `await` points,
 * and nothing guarantees those state updates commit before the next queue
 * read - reading a stale snapshot can un-advance an item back to 'queued'
 * and spin the loop forever reprocessing it.
 */
export function usePhotoUploadModal({ editingMatchId, refreshRelatedMedia, showMessage }: UsePhotoUploadModalArgs) {
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [photoQueue, setPhotoQueue] = useState<PhotoQueueItem[]>([]);

  const queueRef = useRef<PhotoQueueItem[]>([]);
  const processingRef = useRef(false);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const hasSucceededOnceRef = useRef(false);

  const commit = useCallback(() => {
    setPhotoQueue([...queueRef.current]);
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<PhotoQueueItem>) => {
    queueRef.current = queueRef.current.map((item) => (item.id === id ? { ...item, ...patch } : item));
    commit();
  }, [commit]);

  const acquireWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as Navigator & {
          wakeLock: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
        }).wakeLock.request('screen');
      }
    } catch {
      // Best-effort mitigation only - uploads still work without it.
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLockRef.current?.release();
    } catch {
      // Ignore - nothing meaningful to do if release fails.
    } finally {
      wakeLockRef.current = null;
    }
  }, []);

  const uploadOne = useCallback(async (item: PhotoQueueItem) => {
    if (!editingMatchId) {
      // No match is being edited - move the item to a terminal state so
      // processQueue's loop doesn't keep finding the same 'queued' item.
      updateItem(item.id, { status: 'error', error: 'No match selected' });
      return;
    }

    updateItem(item.id, { status: 'compressing', error: undefined });
    const compressed = await compressImageForUpload(item.file);

    updateItem(item.id, { status: 'uploading' });
    try {
      const body = new FormData();
      body.append('photo', compressed, item.name);
      body.append('matchId', editingMatchId);

      const response = await fetch('/api/admin/photo-upload', { method: 'POST', body });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      updateItem(item.id, { status: 'done', optimisedSizeBytes: result.data?.optimisedSizeBytes });

      if (!hasSucceededOnceRef.current) {
        hasSucceededOnceRef.current = true;
        await refreshRelatedMedia();
      }
    } catch (error) {
      updateItem(item.id, { status: 'error', error: (error as Error).message || 'Upload failed' });
    }
  }, [editingMatchId, updateItem, refreshRelatedMedia]);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    await acquireWakeLock();

    try {
      while (true) {
        const next = queueRef.current.find((item) => item.status === 'queued');
        if (!next) break;
        await uploadOne(next);
      }
    } finally {
      processingRef.current = false;
      await releaseWakeLock();
      await refreshRelatedMedia();
    }
  }, [uploadOne, acquireWakeLock, releaseWakeLock, refreshRelatedMedia]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const items: PhotoQueueItem[] = Array.from(files).map((file) => ({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      status: 'queued',
      originalSizeBytes: file.size,
    }));
    queueRef.current = [...queueRef.current, ...items];
    commit();
    void processQueue();
  }, [commit, processQueue]);

  const retryItem = useCallback((id: string) => {
    updateItem(id, { status: 'queued', error: undefined });
    void processQueue();
  }, [updateItem, processQueue]);

  const openPhotoUploadModal = useCallback(() => {
    queueRef.current = [];
    commit();
    hasSucceededOnceRef.current = false;
    setShowPhotoUploadModal(true);
  }, [commit]);

  const closePhotoUploadModal = useCallback(() => {
    setShowPhotoUploadModal(false);
    if (queueRef.current.some((item) => item.status === 'error')) {
      showMessage('Some photos failed to upload - reopen "Upload Photos" to retry them', 'error');
    }
  }, [showMessage]);

  return {
    showPhotoUploadModal,
    photoQueue,
    openPhotoUploadModal,
    closePhotoUploadModal,
    addFiles,
    retryItem,
  };
}
