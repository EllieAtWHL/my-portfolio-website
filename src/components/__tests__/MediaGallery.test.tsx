import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MediaGallery from '../spurs-women/MediaGallery';
import type { PhotoMedia } from '@/lib/data/media';
import { fetchPhotoManifest } from '@/lib/photo-manifest';
import { loadPhotosFromGitHub } from '@/lib/external-photo-loader';

jest.mock('@/lib/photo-manifest', () => ({
  fetchPhotoManifest: jest.fn(),
}));

jest.mock('@/lib/external-photo-loader', () => ({
  loadPhotosFromGitHub: jest.fn(),
}));

const mockFetchPhotoManifest = fetchPhotoManifest as jest.Mock;
const mockLoadPhotosFromGitHub = loadPhotosFromGitHub as jest.Mock;

const photo = (overrides: Partial<PhotoMedia>): PhotoMedia => ({
  id: 1,
  match_id: 1,
  type: 'photo',
  title: null,
  url: 'https://example.com/photo.jpg',
  thumbnail_url: null,
  description: null,
  source: null,
  date: null,
  sort_order: 0,
  created_at: '2026-01-01T00:00:00Z',
  caption: null,
  ...overrides,
});

describe('MediaGallery', () => {
  beforeEach(() => {
    mockLoadPhotosFromGitHub.mockReturnValue([]);
    mockFetchPhotoManifest.mockClear();
  });

  it('shows a skeleton grid, not a spinner, while photo data is loading', () => {
    // Never-resolving promise keeps the component in its loading state for
    // the duration of this test.
    mockFetchPhotoManifest.mockReturnValue(new Promise(() => {}));

    const { container } = render(<MediaGallery photos={[photo({ id: 1 })]} />);

    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();

    const status = screen.getByRole('status', { name: /loading photos/i });
    const placeholders = status.querySelectorAll('.animate-pulse');
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('renders the real photo grid once loading completes', async () => {
    mockFetchPhotoManifest.mockResolvedValue({});

    render(<MediaGallery photos={[photo({ id: 1, url: 'https://example.com/a.jpg' })]} />);

    const img = await screen.findByAltText('Match photo');
    expect(img).toHaveAttribute('src', 'https://example.com/a.jpg');
    expect(screen.queryByRole('status', { name: /loading photos/i })).not.toBeInTheDocument();
  });

  it('renders nothing when there are no photos', () => {
    mockFetchPhotoManifest.mockResolvedValue({});

    const { container } = render(<MediaGallery photos={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a distinguishable error state instead of "no photos" when the manifest fetch fails', async () => {
    mockFetchPhotoManifest.mockRejectedValue(new Error('manifest unavailable'));

    render(<MediaGallery photos={[photo({ id: 1, type: 'photo album', url: 'album-1' })]} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        "Couldn't load photos for this match. Please try again."
      );
    });

    expect(screen.queryByText('No photos available for this match.')).not.toBeInTheDocument();
  });

  it('retries loading photo data when the error state\'s retry button is clicked', async () => {
    mockFetchPhotoManifest
      .mockRejectedValueOnce(new Error('manifest unavailable'))
      .mockResolvedValue({});

    render(<MediaGallery photos={[photo({ id: 1, type: 'photo album', url: 'album-1' })]} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByText('No photos available for this match.')).toBeInTheDocument();
    });
    expect(mockFetchPhotoManifest).toHaveBeenCalledTimes(2);
  });
});
