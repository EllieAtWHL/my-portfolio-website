// Browser-only. Shrinks a phone photo before it goes over the (potentially
// slow/flaky) mobile upload connection - the highest-leverage mitigation for
// the screen-lock/dropped-connection risk found in WEB-148 (see
// reference/photo-gallery/README.md ("Adding photos from a phone")). This is a
// best-effort pass: the server-side sharp resize in
// src/app/api/admin/photo-upload/route.ts is the authoritative step, so
// falling back to the original file on any failure here only costs upload
// time/bandwidth, never correctness.
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.85;

export async function compressImageForUpload(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob) {
      return file;
    }
    return new File([blob], file.name, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
