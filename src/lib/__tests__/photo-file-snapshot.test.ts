import { PhotoUnreadableError, snapshotPickedFile } from '../photo-file-snapshot';

// jsdom's File has no arrayBuffer(), so each test gives its file one.
function pickedFile(name: string, arrayBuffer: () => Promise<ArrayBuffer>): File {
  const file = new File(['ignored'], name, { type: 'image/jpeg', lastModified: 1234 });
  Object.defineProperty(file, 'arrayBuffer', { value: arrayBuffer });
  return file;
}

describe('snapshotPickedFile', () => {
  it('returns a new File holding a copy of the bytes, keeping the name, type and lastModified', async () => {
    const original = pickedFile('a.jpg', async () => new Uint8Array([1, 2, 3, 4]).buffer);

    const copy = await snapshotPickedFile(original);

    expect(copy).not.toBe(original);
    expect(copy.name).toBe('a.jpg');
    expect(copy.type).toBe('image/jpeg');
    expect(copy.lastModified).toBe(1234);
    expect(copy.size).toBe(4);
  });

  it('throws an actionable PhotoUnreadableError when the picked file can no longer be read', async () => {
    const original = pickedFile('b.jpg', async () => {
      throw new DOMException('The requested file could not be read', 'NotReadableError');
    });

    const attempt = snapshotPickedFile(original);

    await expect(attempt).rejects.toBeInstanceOf(PhotoUnreadableError);
    await expect(attempt).rejects.toThrow(/Couldn't read "b.jpg".*Choose it again.*could not be read/);
  });
});
