import { compressImageForUpload, ImageTooLargeError, supportsReducedSizeDecode } from '../image-compression';
import { createCompressionWorker } from '../create-compression-worker';

jest.mock('../create-compression-worker', () => ({
  createCompressionWorker: jest.fn(),
}));

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

    expect(result.compressed).toBe(true);
    expect(result.fallbackReason).toBeUndefined();
    expect(result.file.type).toBe('image/jpeg');
    expect(result.file.name).toBe('photo.jpg');
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

    expect(result.file).toBe(file);
    expect(result.compressed).toBe(false);
    expect(result.fallbackReason).toBe('decode failed');
  });

  it('falls back to the original file if canvas 2d context is unavailable and the file is small enough', async () => {
    global.createImageBitmap = jest.fn().mockResolvedValue({ width: 4000, height: 3000, close: jest.fn() });
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const file = makeFile('photo.jpg', 1024);
    const result = await compressImageForUpload(file);

    expect(result.file).toBe(file);
    expect(result.compressed).toBe(false);
    expect(result.fallbackReason).toBe('2D canvas context unavailable');
  });

  it('throws ImageTooLargeError instead of falling back when compression fails and the original is too large to upload safely', async () => {
    global.createImageBitmap = jest.fn().mockRejectedValue(new Error('decode failed'));

    const file = makeFile('photo.jpg', 5 * 1024 * 1024);

    await expect(compressImageForUpload(file)).rejects.toThrow(ImageTooLargeError);
  });
});

describe('compressImageForUpload in a worker', () => {
  const originalCreateImageBitmap = global.createImageBitmap;
  const mockCreateWorker = createCompressionWorker as jest.MockedFunction<typeof createCompressionWorker>;

  // Minimal stand-in for a Worker: `respond` decides what (if anything) the
  // "worker" posts back once the photo has been sent to it.
  function fakeWorker(respond: (worker: Worker) => void) {
    const worker = {
      onmessage: null,
      onmessageerror: null,
      onerror: null,
      terminate: jest.fn(),
      postMessage: jest.fn(() => respond(worker)),
    } as unknown as Worker & { terminate: jest.Mock; postMessage: jest.Mock };
    return worker;
  }

  function reply(worker: Worker, data: unknown) {
    worker.onmessage?.({ data } as MessageEvent);
  }

  beforeEach(() => {
    // jsdom has neither, so compressImageForUpload skips the worker path
    // unless both are present.
    (global as unknown as { Worker: unknown }).Worker = jest.fn();
    (global as unknown as { OffscreenCanvas: unknown }).OffscreenCanvas = jest.fn();
  });

  afterEach(() => {
    delete (global as unknown as { Worker?: unknown }).Worker;
    delete (global as unknown as { OffscreenCanvas?: unknown }).OffscreenCanvas;
    global.createImageBitmap = originalCreateImageBitmap;
    mockCreateWorker.mockReset();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns the JPEG the worker produced and terminates the worker', async () => {
    const worker = fakeWorker((w) => reply(w, { blob: new Blob(['compressed'], { type: 'image/jpeg' }) }));
    mockCreateWorker.mockReturnValue(worker);
    global.createImageBitmap = jest.fn();

    const result = await compressImageForUpload(makeFile('photo.jpg', 5 * 1024 * 1024));

    expect(result.compressed).toBe(true);
    expect(result.file.type).toBe('image/jpeg');
    expect(result.file.name).toBe('photo.jpg');
    expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({ maxDimension: 2000, quality: 0.85 }));
    expect(worker.terminate).toHaveBeenCalled();
    // Main-thread decode never ran.
    expect(global.createImageBitmap).not.toHaveBeenCalled();
  });

  it('uses a fresh worker for every photo, so one photo\'s decode memory never carries over to the next', async () => {
    const workers = [0, 1].map(() => fakeWorker((w) => reply(w, { blob: new Blob(['x']) })));
    mockCreateWorker.mockReturnValueOnce(workers[0]).mockReturnValueOnce(workers[1]);

    await compressImageForUpload(makeFile('a.jpg', 100));
    await compressImageForUpload(makeFile('b.jpg', 100));

    expect(mockCreateWorker).toHaveBeenCalledTimes(2);
    expect(workers[0].terminate).toHaveBeenCalled();
    expect(workers[1].terminate).toHaveBeenCalled();
  });

  it('does not retry on the main thread when a running worker fails to decode the photo', async () => {
    // A decode failure inside a working worker usually means memory pressure -
    // repeating the decode on the main thread is exactly what WEB-173 removed.
    const worker = fakeWorker((w) => reply(w, { error: 'out of memory' }));
    mockCreateWorker.mockReturnValue(worker);
    global.createImageBitmap = jest.fn();

    await expect(compressImageForUpload(makeFile('photo.jpg', 5 * 1024 * 1024))).rejects.toThrow(
      /Couldn't compress "photo.jpg" \(worker: out of memory\)/
    );
    expect(global.createImageBitmap).not.toHaveBeenCalled();
    expect(worker.terminate).toHaveBeenCalled();
  });

  it('falls back to the main thread when the worker script itself fails to run', async () => {
    const worker = fakeWorker((w) => w.onerror?.({ message: 'script load failed', preventDefault: jest.fn() } as unknown as ErrorEvent));
    mockCreateWorker.mockReturnValue(worker);
    global.createImageBitmap = jest.fn().mockResolvedValue({ width: 100, height: 100, close: jest.fn() });
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: jest.fn(), clearRect: jest.fn() } as unknown as CanvasRenderingContext2D);
    jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(new Blob(['main'])));

    const result = await compressImageForUpload(makeFile('photo.jpg', 5 * 1024 * 1024));

    expect(result.compressed).toBe(true);
    expect(global.createImageBitmap).toHaveBeenCalled();
    expect(worker.terminate).toHaveBeenCalled();
  });

  it('includes both the worker and main-thread reasons when the worker fails to run and the main thread fails too', async () => {
    mockCreateWorker.mockReturnValue(
      fakeWorker((w) => w.onerror?.({ message: 'script load failed', preventDefault: jest.fn() } as unknown as ErrorEvent))
    );
    global.createImageBitmap = jest.fn().mockRejectedValue(new Error('decode failed'));

    const result = await compressImageForUpload(makeFile('photo.jpg', 1024));

    expect(result.compressed).toBe(false);
    expect(result.fallbackReason).toBe('worker: script load failed; main thread: decode failed');
  });

  it('rejects promptly when the worker message cannot be deserialized', async () => {
    mockCreateWorker.mockReturnValue(fakeWorker((w) => w.onmessageerror?.({} as MessageEvent)));

    const result = await compressImageForUpload(makeFile('photo.jpg', 1024));

    expect(result.compressed).toBe(false);
    expect(result.fallbackReason).toBe('worker: compression worker message could not be deserialized');
  });

  it('times out a worker that never responds rather than leaving the photo stuck at "Compressing..."', async () => {
    jest.useFakeTimers();
    const worker = fakeWorker(() => {});
    mockCreateWorker.mockReturnValue(worker);
    global.createImageBitmap = jest.fn();

    const result = compressImageForUpload(makeFile('photo.jpg', 5 * 1024 * 1024));
    const assertion = expect(result).rejects.toThrow('worker: compression worker timed out');
    await jest.advanceTimersByTimeAsync(15_000);
    await assertion;
    expect(worker.terminate).toHaveBeenCalled();
    expect(global.createImageBitmap).not.toHaveBeenCalled();
  });
});

describe('supportsReducedSizeDecode', () => {
  afterEach(() => {
    delete (global as unknown as { ImageDecoder?: unknown }).ImageDecoder;
  });

  it('is false without ImageDecoder (e.g. Safari) and true with it', () => {
    expect(supportsReducedSizeDecode()).toBe(false);
    (global as unknown as { ImageDecoder: unknown }).ImageDecoder = jest.fn();
    expect(supportsReducedSizeDecode()).toBe(true);
  });
});
