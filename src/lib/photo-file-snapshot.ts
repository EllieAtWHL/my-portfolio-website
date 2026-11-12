// Browser-only. Copies a photo picked via <input type="file"> into a
// browser-owned File, so the upload queue no longer depends on the picker's
// reference to the original staying readable.
//
// WEB-244: on Android Chrome, a picked File is backed by a content URI whose
// read access the OS can drop while the page is still working through a
// batch. The upload queue used to read each photo only when it got to it,
// so in a real 19-photo batch the first 10 uploaded and every later read
// failed with NotReadableError ("The requested file could not be read,
// typically due to permission problems that have occurred after a reference
// to a file was acquired"). Compression failed, then the uncompressed
// fallback's fetch failed too (the body was the same unreadable File), and
// Retry failed the same way because it re-read the same dead reference.
// Reading every photo's bytes as soon as it's picked, before any
// compression/upload starts, means the slow per-photo work only ever
// touches the copy.
//
// The copy holds the original encoded bytes (a few MB per photo), not a
// decoded bitmap, so it doesn't bring back the WEB-173 decode-memory
// problem. Chrome's blob storage can also move large blobs to disk.

export class PhotoUnreadableError extends Error {}

export function unreadableMessage(fileName: string, reason: string): string {
  return (
    `Couldn't read "${fileName}" from this device - the browser lost access to it after it was ` +
    `picked. Choose it again with "Choose Photos". (${reason})`
  );
}

export async function snapshotPickedFile(file: File): Promise<File> {
  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch (error) {
    throw new PhotoUnreadableError(unreadableMessage(file.name, (error as Error).message || 'unknown error'));
  }
  return new File([bytes], file.name, { type: file.type, lastModified: file.lastModified });
}
