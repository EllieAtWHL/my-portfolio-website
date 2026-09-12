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
  path?: string;
  blobSha?: string;
  /** Set once this photo's blob has been included in a successful finalize call. */
  published?: boolean;
}

export type FinalizeStatus = 'idle' | 'publishing' | 'error';

interface UsePhotoUploadModalArgs {
  editingMatchId: string | null;
  refreshRelatedMedia: () => Promise<void>;
  showMessage: (text: string, type: 'success' | 'error') => void;
  /** Overridable for tests only - production always uses the 2s default. */
  autoRetryDelayMs?: number;
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
 * Each per-photo request only resizes the photo and creates a git blob -
 * it does not push to the gallery repo. Once every queued photo has
 * settled, finalizeBatch sends the accumulated blobs to
 * /api/admin/photo-upload/finalize in one request, which is the only place
 * that actually commits+pushes - so an album of many photos triggers the
 * gallery repo's manifest webhook once, not once per photo (see WEB-149:
 * one-push-per-photo caused a pile-up of near-duplicate auto-merging PRs
 * that congested CI/Vercel).
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
export function usePhotoUploadModal({
  editingMatchId,
  refreshRelatedMedia,
  showMessage,
  autoRetryDelayMs = 2000,
}: UsePhotoUploadModalArgs) {
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [photoQueue, setPhotoQueue] = useState<PhotoQueueItem[]>([]);
  const [finalizeStatus, setFinalizeStatus] = useState<FinalizeStatus>('idle');
  const [finalizeError, setFinalizeError] = useState<string | null>(null);

  const queueRef = useRef<PhotoQueueItem[]>([]);
  const processingRef = useRef(false);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

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

  // A real-device WEB-149 test batch hit two distinct transient failures in
  // one run: a single mid-batch 401 (Supabase's cookie-based session-refresh
  // race under a long sequence of same-session requests - the very next
  // request succeeded immediately with no user action) and a couple of
  // requests that never reached the server at all (consistent with a
  // momentary mobile-connection drop, not a code defect - client-side
  // compression was working fine for every photo either side of them).
  // Both classes tend to clear within a couple of seconds, so a single
  // automatic retry (used for both per-photo uploads and the batch finalize
  // call below) recovers most of them without the admin needing to notice
  // and tap Retry themselves.
  const withOneAutoRetry = useCallback(async <T,>(attempt: () => Promise<T>): Promise<T> => {
    try {
      return await attempt();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, autoRetryDelayMs));
      return attempt();
    }
  }, [autoRetryDelayMs]);

  const attemptUpload = useCallback(async (item: PhotoQueueItem) => {
    updateItem(item.id, { status: 'compressing', error: undefined });
    // Compression can throw (ImageTooLargeError) rather than silently
    // falling back to a too-large original - a request over Vercel's
    // ~4.5MB body limit is rejected before this route ever runs, so
    // sending it anyway is not a safe fallback.
    const compressed = await compressImageForUpload(item.file);

    updateItem(item.id, { status: 'uploading' });

    const body = new FormData();
    body.append('photo', compressed, item.name);
    body.append('matchId', editingMatchId as string);

    const response = await fetch('/api/admin/photo-upload', { method: 'POST', body });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.data as { path: string; blobSha: string; optimisedSizeBytes: number };
  }, [editingMatchId, updateItem]);

  const uploadOne = useCallback(async (item: PhotoQueueItem) => {
    if (!editingMatchId) {
      // No match is being edited - move the item to a terminal state so
      // processQueue's loop doesn't keep finding the same 'queued' item.
      updateItem(item.id, { status: 'error', error: 'No match selected' });
      return;
    }

    try {
      const { path, blobSha, optimisedSizeBytes } = await withOneAutoRetry(() => attemptUpload(item));
      updateItem(item.id, { status: 'done', path, blobSha, optimisedSizeBytes });
    } catch (error) {
      updateItem(item.id, { status: 'error', error: (error as Error).message || 'Upload failed' });
    }
  }, [editingMatchId, updateItem, attemptUpload, withOneAutoRetry]);

  const finalizeBatch = useCallback(async () => {
    const toPublish = queueRef.current.filter((item) => item.status === 'done' && !item.published && item.path && item.blobSha);
    if (toPublish.length === 0) return;

    setFinalizeStatus('publishing');
    setFinalizeError(null);

    try {
      await withOneAutoRetry(async () => {
        const response = await fetch('/api/admin/photo-upload/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: editingMatchId,
            blobs: toPublish.map((item) => ({ path: item.path, sha: item.blobSha })),
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to publish photos');
        }
      });

      toPublish.forEach((item) => updateItem(item.id, { published: true }));
      setFinalizeStatus('idle');
      await refreshRelatedMedia();
    } catch (error) {
      setFinalizeStatus('error');
      setFinalizeError((error as Error).message || 'Failed to publish photos');
    }
  }, [editingMatchId, updateItem, withOneAutoRetry, refreshRelatedMedia]);

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
      await finalizeBatch();
    }
  }, [uploadOne, acquireWakeLock, releaseWakeLock, finalizeBatch]);

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

  const retryFinalize = useCallback(() => {
    void finalizeBatch();
  }, [finalizeBatch]);

  const openPhotoUploadModal = useCallback(() => {
    queueRef.current = [];
    commit();
    setFinalizeStatus('idle');
    setFinalizeError(null);
    setShowPhotoUploadModal(true);
  }, [commit]);

  const closePhotoUploadModal = useCallback(() => {
    setShowPhotoUploadModal(false);
    if (queueRef.current.some((item) => item.status === 'error')) {
      showMessage('Some photos failed to upload - reopen "Upload Photos" to retry them', 'error');
    } else if (finalizeStatus === 'error') {
      showMessage('Photos uploaded but publishing failed - reopen "Upload Photos" to retry', 'error');
    }
  }, [showMessage, finalizeStatus]);

  return {
    showPhotoUploadModal,
    photoQueue,
    finalizeStatus,
    finalizeError,
    openPhotoUploadModal,
    closePhotoUploadModal,
    addFiles,
    retryItem,
    retryFinalize,
  };
}
