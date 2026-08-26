'use client';

import { YouTubeVideo } from '../../lib/rss';
import { formatDateForCard } from '@/lib/utils/date';
import { Card } from '@/components/Card';
import { ExternalLinkIcon } from './ExternalLinkIcon';

interface VideoCardProps {
  video: YouTubeVideo & { channel?: string };
  showDate?: boolean;
}

export default function VideoCard({ video, showDate = true }: VideoCardProps) {
  return (
    <a 
      href={video.link} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block spurs-text"
    >
      <Card variant="spursAccent" padding="md" clickable={true} className="overflow-hidden">
        <div className="w-full bg-gray-200 relative">
          {video.thumbnail ? (
            <>
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 rounded p-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
            </>
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-gray-300">
              <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3" style={{minHeight: '3rem'}}>
            <h3 className="font-semibold spurs-text line-clamp-2 flex-1">
              {video.title}
            </h3>
            <ExternalLinkIcon className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
          </div>
          {/* gray-400, not gray-500: VideoCard only renders inside .spurs-accent-card,
              which is always dark regardless of the site-wide light/dark toggle - gray-500
              (previously used unconditionally, with no dark: variant) fails 4.5:1 against it. */}
          <div className="flex items-center justify-between">
            {showDate && (
              <p className="text-xs text-gray-400">
                {formatDateForCard(video.pubDate)}
              </p>
            )}
            <span className="text-xs text-gray-400 font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              {video.channel || 'YouTube'}
            </span>
          </div>
        </div>
      </Card>
    </a>
  );
}
