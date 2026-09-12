import { compressImageForUpload, ImageTooLargeError } from '../image-compression';

function makeFile(name: string, sizeBytes: number): File {
  // Actual byte content doesn't matter for these tests (createImageBitmap is
  // mocked), only that `file.size` reports the size we want to test against.
  return new File([new Uint8Array(sizeBytes)], name, { type: 'image/jpeg' });
}

describe('compressImageForUpload', () => {
  const originalCreateImageBitmap = global.createImageBitmap;

  afterEach(() => {
    global.createImageBitmap = originalCreateImageBitmap;
    jest.restoreAllMocks();
  });

  it('compresses via the shared canvas and returns a JPEG File', async () => {
    const close = jest.fn();
    global.createImageBitmap = jest.fn().mockResolvedValue({ width: 4000, height: 3000, close });
    const drawImage = jest.fn();
    const clearRect = jest.fn();
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage, clearRect } as unknown as CanvasRenderingContext2D);
    jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(new Blob(['compressed'], { type: 'image/jpeg' })));

    const file = makeFile('photo.jpg', 1024);
    const result = await compressImageForUpload(file);

    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('photo.jpg');
    expect(drawImage).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('reuses the same canvas element across multiple calls', async () => {
    global.createImageBitmap = jest.fn().mockResolvedValue({ width: 100, height: 100, close: jest.fn() });
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: jest.fn(), clearRect: jest.fn() } as unknown as CanvasRenderingContext2D);
    const createElementSpy = jest.spyOn(document, 'createElement');
    jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(new Blob(['x'])));

    await compressImageForUpload(makeFile('a.jpg', 100));
    await compressImageForUpload(makeFile('b.jpg', 100));

    // The shared canvas may already exist from an earlier test in this file
    // (module-level state persists across tests), so the only thing worth
    // asserting is that these two calls don't create a *second* canvas.
    expect(createElementSpy.mock.calls.filter(([tag]) => tag === 'canvas').length).toBeLessThanOrEqual(1);
  });

  it('falls back to the original file if createImageBitmap fails and the file is small enough to upload as-is', async () => {
    global.createImageBitmap = jest.fn().mockRejectedValue(new Error('decode failed'));

    const file = makeFile('photo.jpg', 1024);
    const result = await compressImageForUpload(file);

    expect(result).toBe(file);
  });

  it('falls back to the original file if canvas 2d context is unavailable and the file is small enough', async () => {
    global.createImageBitmap = jest.fn().mockResolvedValue({ width: 4000, height: 3000, close: jest.fn() });
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const file = makeFile('photo.jpg', 1024);
    const result = await compressImageForUpload(file);

    expect(result).toBe(file);
  });

  it('throws ImageTooLargeError instead of falling back when compression fails and the original is too large to upload safely', async () => {
    global.createImageBitmap = jest.fn().mockRejectedValue(new Error('decode failed'));

    const file = makeFile('photo.jpg', 5 * 1024 * 1024);

    await expect(compressImageForUpload(file)).rejects.toThrow(ImageTooLargeError);
  });
});
