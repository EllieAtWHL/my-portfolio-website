import { jpegDecodeSize, readJpegDimensions } from '../jpeg-dimensions';

// Builds a minimal JPEG header: SOI, an APP1 segment of `app1Length` filler
// bytes (standing in for EXIF/XMP metadata), then a SOF0 marker.
function jpegHeader({ width, height, app1Length = 10, sofMarker = 0xc0 }: { width: number; height: number; app1Length?: number; sofMarker?: number }) {
  const app1 = [0xff, 0xe1, ((app1Length + 2) >> 8) & 0xff, (app1Length + 2) & 0xff, ...new Array(app1Length).fill(0)];
  const sof = [0xff, sofMarker, 0x00, 0x11, 0x08, height >> 8, height & 0xff, width >> 8, width & 0xff, 0x03];
  return new Uint8Array([0xff, 0xd8, ...app1, ...sof]);
}

describe('readJpegDimensions', () => {
  it('reads width and height from the SOF marker after metadata segments', () => {
    expect(readJpegDimensions(jpegHeader({ width: 4032, height: 3024, app1Length: 5000 }))).toEqual({ width: 4032, height: 3024 });
  });

  it('reads progressive JPEGs (SOF2)', () => {
    expect(readJpegDimensions(jpegHeader({ width: 3000, height: 4000, sofMarker: 0xc2 }))).toEqual({ width: 3000, height: 4000 });
  });

  it('does not mistake a DHT (0xC4) segment for a SOF marker', () => {
    const dht = [0xff, 0xc4, 0x00, 0x04, 0x00, 0x00];
    const header = jpegHeader({ width: 100, height: 50 });
    const bytes = new Uint8Array([0xff, 0xd8, ...dht, ...header.slice(2)]);
    expect(readJpegDimensions(bytes)).toEqual({ width: 100, height: 50 });
  });

  it('returns null for non-JPEG data', () => {
    expect(readJpegDimensions(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).toBeNull();
  });

  it('returns null when the SOF marker is beyond the bytes provided', () => {
    const header = jpegHeader({ width: 4032, height: 3024, app1Length: 5000 });
    expect(readJpegDimensions(header.slice(0, 1000))).toBeNull();
  });

  it('returns null when image data starts before any SOF marker', () => {
    expect(readJpegDimensions(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0x00]))).toBeNull();
  });
});

describe('jpegDecodeSize', () => {
  it('asks for half size for a 12MP phone photo, the smallest n/8 that stays at least 2000px', () => {
    expect(jpegDecodeSize({ width: 4032, height: 3024 }, 2000)).toEqual({ desiredWidth: 2016, desiredHeight: 1512 });
  });

  it('uses the longest side, so portrait photos scale the same way', () => {
    expect(jpegDecodeSize({ width: 3024, height: 4032 }, 2000)).toEqual({ desiredWidth: 1512, desiredHeight: 2016 });
  });

  it('rounds scaled dimensions up, matching libjpeg', () => {
    // 4000 * 4/8 = 2000 exactly; 3001 * 4/8 = 1500.5 -> 1501.
    expect(jpegDecodeSize({ width: 4000, height: 3001 }, 2000)).toEqual({ desiredWidth: 2000, desiredHeight: 1501 });
  });

  it('picks a finer step than half when half would drop below the target', () => {
    // 3000 * 5/8 = 1875 is too small; 6/8 = 2250.
    expect(jpegDecodeSize({ width: 3000, height: 2000 }, 2000)).toEqual({ desiredWidth: 2250, desiredHeight: 1500 });
  });

  it('decodes at full size when the photo is already within the limit or no n/8 step fits', () => {
    expect(jpegDecodeSize({ width: 1600, height: 1200 }, 2000)).toEqual({});
    expect(jpegDecodeSize({ width: 2100, height: 1500 }, 2000)).toEqual({});
  });
});
