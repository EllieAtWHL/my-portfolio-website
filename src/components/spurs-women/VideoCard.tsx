'use client';

import { YouTubeVideo } from '../lib/rss';
import { Card } from '@/components/Card';

interface VideoCardProps {
  video: YouTubeVideo;
}

export default function VideoCard({ video }: VideoCardProps) {
  return (
    <Card variant="spursAccent" padding="md" className="overflow-hidden">
      <a 
        href={video.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        <div className="w-full bg-gray-200">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-auto object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-gray-300">
              <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-2">
            {video.title}
          </h3>
          <p className="text-xs text-gray-500">
            {new Date(video.pubDate).toLocaleDateString()}
          </p>
        </div>
      </a>
    </Card>
  );
}
