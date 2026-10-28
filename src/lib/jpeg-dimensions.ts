// Pure helpers for the photo-upload compression worker
// (image-compression.worker.ts) - kept separate so they're unit testable
// without a real Worker/ImageDecoder.

export interface JpegDimensions {
  width: number;
  height: number;
}

/**
 * Reads a JPEG's stored (pre-EXIF-orientation) pixel dimensions from its
 * SOF marker, given the start of the file. Returns null if `bytes` isn't a
 * JPEG or the SOF marker isn't within the bytes provided.
 */
export function readJpegDimensions(bytes: Uint8Array): JpegDimensions | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let pos = 2;
  while (pos + 3 < bytes.length) {
    if (bytes[pos] !== 0xff) return null;
    const marker = bytes[pos + 1];
    // Fill bytes before a marker.
    if (marker === 0xff) {
      pos += 1;
      continue;
    }
    // Standalone markers (RSTn, TEM) carry no length.
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      pos += 2;
      continue;
    }
    // Start of scan: image data follows, so there was no SOF before it.
    if (marker === 0xda) return null;

    const length = (bytes[pos + 2] << 8) | bytes[pos + 3];
    // SOF0-SOF15, excluding DHT (C4), JPG (C8) and DAC (CC).
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      if (pos + 8 >= bytes.length) return null;
      const height = (bytes[pos + 5] << 8) | bytes[pos + 6];
      const width = (bytes[pos + 7] << 8) | bytes[pos + 8];
      return width > 0 && height > 0 ? { width, height } : null;
    }
    pos += 2 + length;
  }
  return null;
}

/**
 * The ImageDecoder desiredWidth/desiredHeight that makes Chrome's JPEG
 * decoder scale during decode to the smallest n/8 size whose longest side
 * is still at least `maxDimension` (the canvas then does the final, small
 * downscale). Chrome picks the largest n/8 scale that fits within the
 * desired size, so asking for exactly 2000px would drop a 4032px photo to
 * 3/8 (1512px) - hence asking for the exact n/8 size instead, rounded up
 * the same way libjpeg rounds scaled dimensions. Returns {} (decode at full
 * size) when no reduction is possible.
 */
export function jpegDecodeSize(
  { width, height }: JpegDimensions,
  maxDimension: number
): { desiredWidth?: number; desiredHeight?: number } {
  const longest = Math.max(width, height);
  for (let eighths = 1; eighths < 8; eighths++) {
    if (Math.ceil((longest * eighths) / 8) >= maxDimension) {
      return {
        desiredWidth: Math.ceil((width * eighths) / 8),
        desiredHeight: Math.ceil((height * eighths) / 8),
      };
    }
  }
  return {};
}
