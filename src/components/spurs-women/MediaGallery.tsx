'use client';

import { useState } from 'react';
import { PhotoMedia } from '../../lib/data/media';
import { fetchPhotoManifest } from '@/lib/photo-manifest';
import { loadPhotosFromGitHub } from '@/lib/external-photo-loader';
import LightboxGallery from './LightboxGallery';
import { Skeleton } from './Skeleton';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { useRetryableAsync } from '@/hooks/useRetryableAsync';

type MediaGalleryProps = {
  photos: PhotoMedia[];
  fullWidth?: boolean;
};

// 3:2 aspect ratio, enforced via the padding-bottom trick. Shared between the
// loading skeleton and the real photo grid so they can't silently desync.
const PHOTO_ASPECT_RATIO_PADDING = '66.67%';

export default function MediaGallery({ photos, fullWidth = false }: MediaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const { data: albumPhotos, loading: isLoading, hasError, retry: retryLoadPhotoData } = useRetryableAsync<
    Record<string, string[]>
  >(
    async () => {
      // Load manifest for GitHub-based photos
      const manifest = await fetchPhotoManifest();

      // Load photos for all albums using GitHub
      const photoAlbums = photos.filter((photo) => photo.type === 'photo album');
      const albumData: Record<string, string[]> = {};

      for (const album of photoAlbums) {
        if (album.url) {
          const albumPhotos = loadPhotosFromGitHub(album, manifest);
          if (albumPhotos.length > 0) {
            albumData[album.url] = albumPhotos;
          }
        }
      }

      return albumData;
    },
    {},
    [photos],
    'Error loading photo data:'
  );

  // Determine grid layout based on fullWidth prop
  const gridClass = fullWidth
    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    : "grid grid-cols-2 md:grid-cols-3 gap-4";

  if (!photos || photos.length === 0) return null;

  // Show a skeleton grid (matching the real grid's shape and aspect ratio)
  // while data is being fetched, rather than a spinner - preserves layout
  // and previews what's about to appear, per the design system's loading
  // state guidance.
  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="font-bold media-title mb-4">Photos</h2>
        <div className={gridClass} role="status" aria-label="Loading photos">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="rounded-lg overflow-hidden bg-gray-800 relative"
              style={{ paddingBottom: PHOTO_ASPECT_RATIO_PADDING }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Combine individual photos with album photos using GitHub
  const allPhotos = photos.reduce((acc: PhotoMedia[], photo) => {
    if (photo.type === 'photo album') {
      const storageKey = photo.url;

      if (storageKey && albumPhotos[storageKey]) {
        const albumImages = albumPhotos[storageKey].map((url, index) => ({
          id: `${photo.id}-${index}`,
          match_id: photo.match_id,
          url,
          caption: photo.caption,
          type: 'photo' as const,
          title: photo.title,
          thumbnail_url: photo.thumbnail_url,
          description: photo.description,
          source: photo.source,
          date: photo.date,
          sort_order: photo.sort_order,
          created_at: photo.created_at,
        }));
        return [...acc, ...albumImages];
      }
    } else if (photo.type === 'photo') {
      // Add individual photo (skip photo album entries)
      return [...acc, photo];
    }
    // Skip photo album entries from final display
    return acc;
  }, []);


  const openLightbox = (index: number) => {
    setInitialIndex(index);
    setLightboxOpen(true);
  };

  const openGalleryFromStart = () => {
    setInitialIndex(0);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold media-title mb-4">Photos</h2>
          {allPhotos.length > 0 && (
            <Button
              onClick={openGalleryFromStart}
              variant="spurs"
              size="sm"
            >
              View in Gallery
            </Button>
          )}
        </div>

        {allPhotos.length > 0 ? (
          <div className={gridClass}>
            {allPhotos.slice(0, 12).map((photo, index) => ( // Only show first 12 photos initially
              <div
                key={photo.id}
                className="cursor-pointer group rounded-lg overflow-hidden bg-gray-800 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                onClick={() => openLightbox(index)}
                role="button"
                tabIndex={0}
                aria-label={photo.caption ? `View photo: ${photo.caption}` : 'View photo'}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openLightbox(index);
                  }
                }}
                style={{ paddingBottom: PHOTO_ASPECT_RATIO_PADDING }}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Match photo'}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  draggable={false}
                  onError={() => {
                    console.error('Failed to load image:', photo.url);
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-auto"
                  style={{ backgroundColor: 'transparent' }}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>
            ))}
            {allPhotos.length > 12 && (
              <div className="col-span-full text-center py-4">
                <Button
                  onClick={openGalleryFromStart}
                  variant="spurs"
                >
                  View All {allPhotos.length} Photos in Gallery
                </Button>
              </div>
            )}
          </div>
        ) : hasError ? (
          <ErrorState
            message="Couldn't load photos for this match. Please try again."
            onRetry={retryLoadPhotoData}
            cardVariant="spursAccent"
            buttonVariant="spurs"
          />
        ) : (
          <p className="text-gray-500 italic">No photos available for this match.</p>
        )}
      </div>

      <LightboxGallery
        photos={allPhotos}
        initialIndex={initialIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
