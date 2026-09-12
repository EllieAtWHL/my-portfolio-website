import { compressImageForUpload } from '../image-compression';

describe('compressImageForUpload', () => {
  const originalCreateImageBitmap = global.createImageBitmap;

  afterEach(() => {
    global.createImageBitmap = originalCreateImageBitmap;
  });

  it('falls back to the original file if createImageBitmap is unavailable/fails', async () => {
    // @ts-expect-error - simulating an environment without createImageBitmap support
    global.createImageBitmap = undefined;

    const file = new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await compressImageForUpload(file);

    expect(result).toBe(file);
  });

  it('falls back to the original file if canvas 2d context is unavailable', async () => {
    global.createImageBitmap = jest.fn().mockResolvedValue({ width: 4000, height: 3000, close: jest.fn() });
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const file = new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await compressImageForUpload(file);

    expect(result).toBe(file);
  });
});
