'use client';

import { useState, useEffect } from 'react';
import { PhotoMedia } from '../../lib/data/media';
import { PhotoAlbumMedia } from '../../types/photo-manifest';
import { fetchPhotoManifest } from '@/lib/photo-manifest';
import { loadPhotosHybridWithExternal, generateExternalRepoMigration } from '@/lib/external-photo-loader';
import LightboxGallery from './LightboxGallery';
import { Button } from '@/components/Button';

type MediaGalleryProps = {
  photos: PhotoMedia[];
  fullWidth?: boolean;
};

export default function MediaGallery({ photos, fullWidth = false }: MediaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);
  const [photoManifest, setPhotoManifest] = useState<Record<string, string[]>>({});
  const [albumPhotos, setAlbumPhotos] = useState<Record<string, string[]>>({});
  const [isLoadingManifest, setIsLoadingManifest] = useState(true);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(true);

  // Fetch photo manifest and load album photos on component mount
  useEffect(() => {
    async function loadPhotoData() {
      try {
        setIsLoadingManifest(true);
        setIsLoadingAlbums(true);
        
        // Load manifest for GitHub-based photos
        const manifest = await fetchPhotoManifest();
        setPhotoManifest(manifest);
        
        // Load photos for all albums using hybrid approach (supports both Supabase and external)
        const photoAlbums = photos.filter(photo => photo.type === 'photo album');
        const albumData: Record<string, string[]> = {};
        
        // Generate migration SQL for debugging
        const migrationSQL = generateExternalRepoMigration(photoAlbums);
        if (migrationSQL.length > 0) {
          console.log('=== Storage Source Migration SQL ===');
          migrationSQL.forEach(sql => console.log(sql));
          console.log('=== End Migration SQL ===');
        }
        
        for (const album of photoAlbums) {
          if (album.url) {
            const albumPhotos = await loadPhotosHybridWithExternal(album, manifest);
            if (albumPhotos.length > 0) {
              albumData[album.url] = albumPhotos;
            }
          }
        }
        
        setAlbumPhotos(albumData);
        
      } catch (error) {
        console.error('Error loading photo data:', error);
      } finally {
        setIsLoadingManifest(false);
        setIsLoadingAlbums(false);
      }
    }

    loadPhotoData();
  }, [photos]);

  if (!photos || photos.length === 0) return null;

  // Show loading state while data is being fetched
  if (isLoadingManifest || isLoadingAlbums) {
    return (
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Photos</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          <span className="ml-2 text-gray-500">
            {isLoadingManifest ? 'Loading photo gallery...' : 'Loading photos...'}
          </span>
        </div>
      </div>
    );
  }

  // Combine individual photos with album photos using hybrid approach (supports both Supabase and external)
  const allPhotos = photos.reduce((acc: PhotoMedia[], photo) => {
    if (photo.type === 'photo album') {
      const storageKey = photo.url;
      
      console.log('Processing photo album:', {
        id: photo.id,
        url: photo.url,
        storageSource: photo.storage_source,
        storageKey,
        hasAlbumPhotos: !!albumPhotos[storageKey],
        albumPhotosCount: albumPhotos[storageKey]?.length || 0
      });
      
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
        console.log('Adding album images:', albumImages.length);
        return [...acc, ...albumImages];
      } else {
        console.log('No photos found for album:', storageKey);
      }
    } else if (photo.type === 'photo') {
      // Add individual photo (skip photo album entries)
      console.log('Adding individual photo:', photo.id);
      return [...acc, photo];
    }
    // Skip photo album entries from final display
    return acc;
  }, []);
  
  console.log('Final allPhotos count:', allPhotos.length);

  const openLightbox = (index: number) => {
    setInitialIndex(index);
    setLightboxOpen(true);
  };

  const openGalleryFromStart = () => {
    setInitialIndex(0);
    setLightboxOpen(true);
  };

  // Determine grid layout based on fullWidth prop
  const gridClass = fullWidth 
    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
    : "grid grid-cols-2 md:grid-cols-3 gap-4";

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold mb-4">Photos</h2>
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
                className="cursor-pointer group rounded-lg overflow-hidden bg-gray-800 relative"
                onClick={() => openLightbox(index)}
                style={{ paddingBottom: '66.67%' }} // 3:2 aspect ratio
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
                  onError={(e) => {
                    console.error('Failed to load image:', photo.url);
                  }}
                />
                {/* Protection overlay */}
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
        ) : (
          <p className="text-gray-500 italic">No photos available for this match.</p>
        )}
      </div>

      {/* Lightbox Gallery */}
      <LightboxGallery
        photos={allPhotos}
        initialIndex={initialIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
