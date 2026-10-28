// Runs one photo's decode/resize/re-encode for compressImageForUpload
// (src/lib/image-compression.ts), off the main thread. The caller spawns a
// fresh worker per photo and terminates it afterwards - see that file for why
// (WEB-173: tearing the worker down is the only reliable way to hand a
// full-resolution decode's memory back to a mobile browser between photos).
export interface CompressionWorkerRequest {
  file: File;
  maxDimension: number;
  quality: number;
}

export type CompressionWorkerResponse = { blob: Blob } | { error: string };

// The DOM and WebWorker TS libs conflict, so type just the bits of the
// worker global this file actually uses.
const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<CompressionWorkerRequest>) => void) | null;
  postMessage: (message: CompressionWorkerResponse) => void;
};

workerScope.onmessage = async (event) => {
  const { file, maxDimension, quality } = event.data;
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D canvas context unavailable in worker');
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    bitmap = null;

    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    workerScope.postMessage({ blob });
  } catch (error) {
    workerScope.postMessage({ error: (error as Error).message || 'unknown error' });
  } finally {
    bitmap?.close();
  }
};
