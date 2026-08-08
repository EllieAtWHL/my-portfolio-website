'use client';

import { useState, useEffect } from 'react';
import { PhotoMedia } from '../../lib/data/media';
import { fetchPhotoManifest } from '@/lib/photo-manifest';
import { loadPhotosFromGitHub } from '@/lib/external-photo-loader';
import LightboxGallery from './LightboxGallery';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';

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
  const [albumPhotos, setAlbumPhotos] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch logic stays local to the effect (rather than a shared useCallback
  // also called from the retry button) - keeps react-hooks/set-state-in-effect
  // happy, since it flags a memoized fetch function reachable from both an
  // effect and an external handler even though these setState calls only
  // ever run after the awaited request settles. Retrying bumps retryCount
  // to re-trigger this same effect.
  useEffect(() => {
    async function loadPhotoData() {
      setIsLoading(true);
      try {
        // Load manifest for GitHub-based photos
        const manifest = await fetchPhotoManifest();

        // Load photos for all albums using GitHub
        const photoAlbums = photos.filter(photo => photo.type === 'photo album');
        const albumData: Record<string, string[]> = {};

        for (const album of photoAlbums) {
          if (album.url) {
            const albumPhotos = loadPhotosFromGitHub(album, manifest);
            if (albumPhotos.length > 0) {
              albumData[album.url] = albumPhotos;
            }
          }
        }

        setAlbumPhotos(albumData);
        setHasError(false);

      } catch (error) {
        console.error('Error loading photo data:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadPhotoData();
  }, [photos, retryCount]);

  const retryLoadPhotoData = () => setRetryCount((count) => count + 1);

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
            <div
              key={index}
              className="rounded-lg overflow-hidden bg-gray-800 relative animate-pulse motion-reduce:animate-none"
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
          storage_source: photo.storage_source
        }));
        return [...acc, ...albumImages];
      } else {
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
