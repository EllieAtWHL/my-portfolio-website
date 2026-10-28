// Runs one photo's decode/resize/re-encode for compressImageForUpload
// (src/lib/image-compression.ts), off the main thread. The caller spawns a
// fresh worker per photo and terminates it afterwards - see that file for why.
import { jpegDecodeSize, readJpegDimensions } from './jpeg-dimensions';

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

// EXIF + XMP (incl. a motion photo's metadata) sit before the SOF marker;
// 256KB comfortably covers them without reading the whole photo.
const JPEG_HEADER_BYTES = 256 * 1024;

interface DecodedPhoto {
  source: CanvasImageSource;
  /** Dimensions after EXIF orientation is applied. */
  width: number;
  height: number;
  release: () => void;
}

// WEB-173: a full-resolution decode of a 12MP photo is ~48MB, and on Android
// Chrome that memory isn't released between photos - not even by
// terminating this worker, since decoded image memory lives in the tab's
// renderer process - so a batch ran out after a handful of photos. For a
// JPEG, ImageDecoder's desiredWidth/desiredHeight make the JPEG decoder
// scale while decoding (libjpeg's n/8 DCT scaling), so the full-resolution
// bitmap is never allocated: 4032x3024 decodes straight to 2016x1512, ~12MB.
// Verified in Chromium that the frame's coded size really is the reduced
// size, and that drawing the frame applies EXIF orientation (frame.rotation)
// the same way createImageBitmap's imageOrientation: 'from-image' does.
async function decodeJpegScaled(file: File, maxDimension: number): Promise<DecodedPhoto | null> {
  if (typeof ImageDecoder === 'undefined' || file.type !== 'image/jpeg') return null;
  if (!(await ImageDecoder.isTypeSupported('image/jpeg'))) return null;

  const header = new Uint8Array(await file.slice(0, JPEG_HEADER_BYTES).arrayBuffer());
  const dimensions = readJpegDimensions(header);
  if (!dimensions) return null;

  const decoder = new ImageDecoder({
    data: file.stream(),
    type: 'image/jpeg',
    ...jpegDecodeSize(dimensions, maxDimension),
  });
  try {
    const { image } = await decoder.decode();
    return {
      source: image,
      width: image.displayWidth,
      height: image.displayHeight,
      release: () => {
        image.close();
        decoder.close();
      },
    };
  } catch (error) {
    decoder.close();
    throw error;
  }
}

async function decodeFullSize(file: File): Promise<DecodedPhoto> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
}

workerScope.onmessage = async (event) => {
  const { file, maxDimension, quality } = event.data;
  let photo: DecodedPhoto | null = null;
  try {
    photo = (await decodeJpegScaled(file, maxDimension)) ?? (await decodeFullSize(file));
    const scale = Math.min(1, maxDimension / Math.max(photo.width, photo.height));
    const width = Math.round(photo.width * scale);
    const height = Math.round(photo.height * scale);

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D canvas context unavailable in worker');
    }
    ctx.drawImage(photo.source, 0, 0, width, height);
    photo.release();
    photo = null;

    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    workerScope.postMessage({ blob });
  } catch (error) {
    workerScope.postMessage({ error: (error as Error).message || 'unknown error' });
  } finally {
    photo?.release();
  }
};
