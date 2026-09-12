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
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.85;

// Comfortably under Vercel's ~4.5MB hard limit, leaving room for
// multipart/form-data overhead.
const MAX_SAFE_UPLOAD_BYTES = 4 * 1024 * 1024;

export class ImageTooLargeError extends Error {}

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

export async function compressImageForUpload(file: File): Promise<CompressionResult> {
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
    return { file: new File([blob], file.name, { type: 'image/jpeg' }), compressed: true };
  } catch (error) {
    const reason = (error as Error).message || 'unknown error';
    if (file.size > MAX_SAFE_UPLOAD_BYTES) {
      throw new ImageTooLargeError(
        `Couldn't compress "${file.name}" (${reason}), and its original size ` +
        `(${Math.round(file.size / 1024)}KB) is too large to upload as-is.`
      );
    }
    // Small enough to upload uncompressed without hitting Vercel's body-size
    // limit - the server-side sharp resize is still the authoritative step.
    return { file, compressed: false, fallbackReason: reason };
  } finally {
    bitmap?.close();
  }
}
