'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { PhotoMedia } from '../../types/media';
import LightboxGallery from './LightboxGallery';
import { Button } from '@/components/Button';

type MediaGalleryProps = {
  photos: PhotoMedia[];
  fullWidth?: boolean;
};

export default function MediaGallery({ photos, fullWidth = false }: MediaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);
  const [albumPhotos, setAlbumPhotos] = useState<{ [key: string]: string[] }>({});

  // Fetch photos from storage for photo albums
  useEffect(() => {
    async function fetchAlbumPhotos() {
      const photoAlbums = photos.filter(photo => photo.type === 'photo album');
      
      const albumData: { [key: string]: string[] } = {};
      
      for (const album of photoAlbums) {
        // Try different approaches to get storage path
        let storagePath = '';
        
        if (album.url && album.url.startsWith('storage/')) {
          storagePath = album.url.replace('storage/', '');
        } else if (album.url && !album.url.startsWith('http')) {
          // If it's not a full URL, treat it as a storage path directly
          storagePath = album.url;
        } else {
          continue; // Skip unrecognized formats
        }
        
        if (storagePath) {
          try {
            // List the album folder directly
            const { data: photos, error } = await supabase.storage
              .from('match-photos')
              .list(storagePath);
            
            if (!error && photos && photos.length > 0) {
              const photoUrls = photos.map(file => {
                const { data: { publicUrl } } = supabase.storage
                  .from('match-photos')
                  .getPublicUrl(`${storagePath}/${file.name}`);
                return publicUrl;
              });
              
              albumData[storagePath] = photoUrls;
            } else if (error) {
              console.error(`Error loading album ${storagePath}:`, error);
            }
          } catch (err) {
            console.error(`Error accessing album ${storagePath}:`, err);
          }
        }
      }
      
      setAlbumPhotos(albumData);
    }

    fetchAlbumPhotos();
  }, [photos]);

  if (!photos || photos.length === 0) return null;

  // Combine individual photos with album photos
  const allPhotos = photos.reduce((acc: PhotoMedia[], photo) => {
    if (photo.type === 'photo album') {
      // Try different approaches to get storage path
      let storagePath = '';
      
      if (photo.url && photo.url.startsWith('storage/')) {
        storagePath = photo.url.replace('storage/', '');
      } else if (photo.url && !photo.url.startsWith('http')) {
        // If it's not a full URL, treat it as a storage path directly
        storagePath = photo.url;
      }
      
      // Add all photos from the album
      if (storagePath && albumPhotos[storagePath]) {
        const albumImages = albumPhotos[storagePath].map((url, index) => ({
          id: `${photo.id}-${index}`,
          url,
          caption: photo.caption,
          type: 'photo' as const
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

  // Determine grid layout based on fullWidth prop
  const gridClass = fullWidth 
    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
    : "grid grid-cols-2 md:grid-cols-3 gap-4";

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Photos</h2>
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
