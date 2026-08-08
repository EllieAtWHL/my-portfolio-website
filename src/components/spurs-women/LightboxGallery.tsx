'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import { PhotoMedia } from '../../types/media';
import { useFocusTrap } from '@/hooks/useFocusTrap';

type LightboxGalleryProps = {
  photos: PhotoMedia[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
};

export default function LightboxGallery({ 
  photos, 
  initialIndex = 0, 
  isOpen, 
  onClose 
}: LightboxGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const currentPhoto = photos[currentIndex];

  // Reset loading state when changing photos (adjusting state during render,
  // per https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  // Keyed on photo id rather than index so a photos-array change that leaves
  // currentIndex numerically the same (e.g. the list gets reordered/filtered
  // while the lightbox is open) still triggers a reload of the new photo.
  const [loadingForPhotoId, setLoadingForPhotoId] = useState(currentPhoto?.id);
  if (currentPhoto && currentPhoto.id !== loadingForPhotoId) {
    setLoadingForPhotoId(currentPhoto.id);
    setIsLoading(true);
  }

  const navigatePrevious = useCallback(() => {
    setCurrentIndex((prev: number) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const navigateNext = useCallback(() => {
    setCurrentIndex((prev: number) => (prev + 1) % photos.length);
  }, [photos.length]);

  const titleId = useId();
  // Escape-to-close and Tab-trapping are handled by useFocusTrap below; this
  // effect only needs to own the gallery-specific Arrow key navigation.
  const containerRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          navigatePrevious();
          break;
        case 'ArrowRight':
          navigateNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, navigatePrevious, navigateNext]);

  // Auto-hide controls
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timer);
      setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isOpen || !currentPhoto) return null;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- click-outside-to-close; Escape (handled by useFocusTrap) is the keyboard equivalent, not a key event on this div
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <h2 id={titleId} className="sr-only">
        {currentPhoto.caption ? `Photo: ${currentPhoto.caption}` : `Photo ${currentIndex + 1} of ${photos.length}`}
      </h2>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div
            className="h-12 w-12 rounded-full bg-white/40 animate-pulse motion-reduce:animate-none"
            role="status"
            aria-label="Loading image"
          />
        </div>
      )}

      {/* Main image container */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- only stops the backdrop's onClose click from bubbling, not a real interactive handler */}
      <div
        className="relative w-full h-full overflow-hidden flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto.url}
          alt={currentPhoto.caption || 'Match photo'}
          className="max-w-full max-h-full object-contain"
          onLoad={() => setIsLoading(false)}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          draggable={false}
        />
        {/* Protection overlay */}
        <div 
          className="absolute inset-0 pointer-events-auto"
          style={{ backgroundColor: 'transparent' }}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      {/* Controls overlay. focus-within:opacity-100 keeps a keyboard user's
          currently-focused control visible even after the mouse-inactivity
          auto-hide above has faded it out - otherwise Tab lands on an
          invisible button. */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 focus-within:opacity-100 focus-within:pointer-events-auto ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="text-sm">
              {currentIndex + 1} / {photos.length}
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <button
          className="absolute left-4 top-1/2 transform -translate-y-1/2 lightbox-nav-button p-3 rounded-full pointer-events-auto transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigatePrevious();
          }}
          disabled={photos.length <= 1}
          aria-label="Previous photo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          className="absolute right-4 top-1/2 transform -translate-y-1/2 lightbox-nav-button p-3 rounded-full pointer-events-auto transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigateNext();
          }}
          disabled={photos.length <= 1}
          aria-label="Next photo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            {/* Caption */}
            {currentPhoto.caption && (
              <div className="text-white text-sm flex-1 mr-4">
                {currentPhoto.caption}
              </div>
            )}

            {/* Close button */}
            <button
              className="lightbox-nav-button p-2 rounded-full pointer-events-auto transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Close (ESC)"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-8">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                    index === currentIndex 
                      ? 'border-white' 
                      : 'border-transparent hover:border-white/50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                >
                  <img
                    src={photo.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    draggable={false}
                  />
                  {/* Thumbnail protection overlay */}
                  <div 
                    className="absolute inset-0 pointer-events-auto"
                    style={{ backgroundColor: 'transparent' }}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
