'use client';

import { useRef } from 'react';

interface MapProps {
  latitude: number | null;
  longitude: number | null;
  stadiumName: string;
  className?: string;
}

export default function InteractiveMap({ latitude, longitude, stadiumName, className = '' }: MapProps) {
  const mapRef = useRef<HTMLIFrameElement>(null);

  if (!latitude || !longitude) {
    return (  
      <div className={`bg-gray-200 rounded-lg flex items-center justify-center h-64 ${className}`}>
        <p className="text-gray-600">Map coordinates not available</p>
      </div>
    );
  }

  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.0005},${latitude+0.0005},${longitude+0.0005},${latitude-0.0005}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div className={`rounded-lg overflow-hidden h-64 w-full ${className}`}>
      <iframe
        ref={mapRef}
        src={embedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        title={`Map showing location of ${stadiumName}`}
        className="rounded-lg"
      />
    </div>
  );
}
