// Browser-only. Shrinks a phone photo before it goes over the (potentially
// slow/flaky) mobile upload connection - the highest-leverage mitigation for
// the screen-lock/dropped-connection risk found in WEB-148 (see
// reference/photo-gallery/README.md ("Adding photos from a phone")).
//
// This is NOT just a speed optimisation: Vercel's Node.js serverless
// functions hard-cap request bodies at ~4.5MB (a platform limit, not
// something this app can raise), and real phone photos routinely exceed
// that uncompressed - so unlike the original design, silently falling back
// to the original file on failure is not safe here. A real-device WEB-149
// test hit exactly this: after the first photo, every subsequent photo
// failed instantly with a client-side "Failed to fetch" that never reached
// the server at all (confirmed via Vercel's request logs - zero failed
// invocations were logged for the route). The most likely cause: creating a
// fresh <canvas> and decoding a full-resolution ImageBitmap per photo in a
// tight loop exhausted some mobile-browser resource budget after the first
// photo, silently falling back to the ~5-8MB original, which then got
// rejected at Vercel's edge before the function ever ran.
//
// Fixed by reusing one canvas across calls instead of creating one per
// photo, and by throwing a descriptive error (rather than silently
// returning the original) whenever compression fails and the original is
// too large to have any realistic chance of being accepted.
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.85;

// Comfortably under Vercel's ~4.5MB hard limit, leaving room for
// multipart/form-data overhead.
const MAX_SAFE_UPLOAD_BYTES = 4 * 1024 * 1024;

export class ImageTooLargeError extends Error {}

let sharedCanvas: HTMLCanvasElement | null = null;

function getSharedCanvas(): HTMLCanvasElement {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
  }
  return sharedCanvas;
}

export async function compressImageForUpload(file: File): Promise<File> {
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
    return new File([blob], file.name, { type: 'image/jpeg' });
  } catch (error) {
    if (file.size > MAX_SAFE_UPLOAD_BYTES) {
      throw new ImageTooLargeError(
        `Couldn't compress "${file.name}" (${(error as Error).message}), and its original size ` +
        `(${Math.round(file.size / 1024)}KB) is too large to upload as-is.`
      );
    }
    // Small enough to upload uncompressed without hitting Vercel's body-size
    // limit - the server-side sharp resize is still the authoritative step.
    return file;
  } finally {
    bitmap?.close();
  }
}
