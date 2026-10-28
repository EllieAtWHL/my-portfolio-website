import { createCompressionWorker } from './create-compression-worker';
import type { CompressionWorkerResponse } from './image-compression.worker';

// Browser-only. Shrinks a phone photo before it goes over the (potentially
// slow/flaky) mobile upload connection - the highest-leverage mitigation for
// the screen-lock/dropped-connection risk found in WEB-148 (see
// reference/photo-gallery/README.md ("Adding photos from a phone")).
//
// This is NOT just a speed optimisation: Vercel's Node.js serverless
// functions hard-cap request bodies at ~4.5MB (a platform limit, not
// something this app can raise), and real phone photos routinely exceed
// that uncompressed - so unlike an earlier version of this function,
// silently falling back to the original file on failure is not safe here.
//
// Whether compression actually ran (vs a fallback to the original file) is
// returned to the caller rather than swallowed, specifically so a later
// "Failed to fetch" (which never reaches the server, so nothing there can
// explain it either) can be diagnosed from what was actually attempted:
// e.g. a photo whose compression silently failed would otherwise look
// identical to a normal successful case right up until the network error.
//
// WEB-173: decoding happens in a fresh Web Worker per photo, terminated
// afterwards, and for JPEGs the worker decodes at a reduced size (via
// ImageDecoder) rather than full resolution - see image-compression.worker.ts.
// A full-resolution decode of a 12MP phone photo needs a ~48MB bitmap
// regardless of the 2000px output, and Android Chrome didn't hand that
// memory back between photos: a batch got ~5 photos in before every later
// decode failed, and Retry failed identically until a page reload.
// Terminating the worker alone was NOT enough (a real-device batch still
// failed after 3 photos with "The source image could not be decoded"), since
// decoded image memory lives in the tab's renderer process rather than the
// worker's heap - the reduced-size decode is the part that actually cuts
// per-photo memory. The main-thread path below is kept only for when the
// worker can't run at all (no Worker/OffscreenCanvas support, or the worker
// script fails to load) - NOT after a decode error or timeout inside a
// running worker, since those usually mean memory pressure and retrying on
// the main thread would just recreate the WEB-173 failure.
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.85;

// Comfortably under Vercel's ~4.5MB hard limit, leaving room for
// multipart/form-data overhead.
const MAX_SAFE_UPLOAD_BYTES = 4 * 1024 * 1024;

// A worker the browser kills outright (e.g. out of memory) may never post a
// message or fire onerror - without a timeout the photo would sit at
// "Compressing..." forever and block the rest of the queue. A phone decode
// normally takes 1-2s.
const WORKER_TIMEOUT_MS = 15_000;

export class ImageTooLargeError extends Error {}

/** The worker couldn't run at all, as opposed to failing to decode a photo. */
class WorkerUnavailableError extends Error {}

export interface CompressionResult {
  file: File;
  /** false if compression failed and `file` is the original, uncompressed input. */
  compressed: boolean;
  /** Present only when compressed is false - why the compression attempt failed. */
  fallbackReason?: string;
}

let sharedCanvas: HTMLCanvasElement | null = null;

function getSharedCanvas(): HTMLCanvasElement {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
  }
  return sharedCanvas;
}

/**
 * Whether this browser can do the reduced-size JPEG decode that keeps a
 * large batch within mobile memory (Chromium-based browsers, as of WEB-173).
 * Without it, compression still works but decodes each photo at full
 * resolution, so a big batch on a phone can run out of memory partway
 * through - the upload modal warns about this.
 */
export function supportsReducedSizeDecode(): boolean {
  return typeof ImageDecoder !== 'undefined' && canCompressInWorker();
}

function canCompressInWorker(): boolean {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';
}

async function compressInWorker(file: File): Promise<Blob> {
  let worker: Worker;
  try {
    worker = createCompressionWorker();
  } catch (error) {
    throw new WorkerUnavailableError((error as Error).message || 'compression worker failed to start');
  }
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await new Promise<Blob>((resolve, reject) => {
      timeout = setTimeout(() => reject(new Error('compression worker timed out')), WORKER_TIMEOUT_MS);
      worker.onmessage = (event: MessageEvent<CompressionWorkerResponse>) => {
        if ('blob' in event.data) {
          resolve(event.data.blob);
        } else {
          reject(new Error(event.data.error));
        }
      };
      worker.onmessageerror = () => reject(new Error('compression worker message could not be deserialized'));
      // The worker catches its own decode errors and posts them back, so
      // onerror firing means the worker script itself didn't load/run.
      worker.onerror = (event) => {
        event.preventDefault();
        reject(new WorkerUnavailableError(event.message || 'compression worker failed to start'));
      };
      worker.postMessage({ file, maxDimension: MAX_DIMENSION, quality: JPEG_QUALITY });
    });
  } finally {
    clearTimeout(timeout);
    worker.terminate();
  }
}

async function compressOnMainThread(file: File): Promise<Blob> {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = getSharedCanvas();
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D canvas context unavailable');
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob) {
      throw new Error('Canvas produced no image data');
    }
    return blob;
  } finally {
    bitmap?.close();
  }
}

export async function compressImageForUpload(file: File): Promise<CompressionResult> {
  let workerReason: string | undefined;
  if (canCompressInWorker()) {
    try {
      const blob = await compressInWorker(file);
      return { file: new File([blob], file.name, { type: 'image/jpeg' }), compressed: true };
    } catch (error) {
      workerReason = (error as Error).message || 'unknown error';
      if (!(error instanceof WorkerUnavailableError)) {
        return fallBackToOriginal(file, `worker: ${workerReason}`);
      }
    }
  }

  try {
    const blob = await compressOnMainThread(file);
    return { file: new File([blob], file.name, { type: 'image/jpeg' }), compressed: true };
  } catch (error) {
    const mainThreadReason = (error as Error).message || 'unknown error';
    return fallBackToOriginal(file, workerReason ? `worker: ${workerReason}; main thread: ${mainThreadReason}` : mainThreadReason);
  }
}

function fallBackToOriginal(file: File, reason: string): CompressionResult {
  if (file.size > MAX_SAFE_UPLOAD_BYTES) {
    throw new ImageTooLargeError(
      `Couldn't compress "${file.name}" (${reason}), and its original size ` +
      `(${Math.round(file.size / 1024)}KB) is too large to upload as-is.`
    );
  }
  // Small enough to upload uncompressed without hitting Vercel's body-size
  // limit - the server-side sharp resize is still the authoritative step.
  return { file, compressed: false, fallbackReason: reason };
}
