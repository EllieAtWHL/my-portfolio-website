'use client';

import { useState, useEffect } from 'react';
import { PhotoMedia } from '../types/media';

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

  // Reset loading state when changing photos
  useEffect(() => {
    setIsLoading(true);
  }, [currentIndex]);

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
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

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

  const navigatePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const navigateNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  if (!isOpen || !currentPhoto) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Main image container */}
      <div 
        className="relative max-w-full max-h-full overflow-hidden"
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

      {/* Controls overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
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
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full pointer-events-auto transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigatePrevious();
          }}
          disabled={photos.length <= 1}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full pointer-events-auto transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigateNext();
          }}
          disabled={photos.length <= 1}
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
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full pointer-events-auto transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Close (ESC)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
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
