'use client';

import { useEffect, useState } from 'react';
import { Media } from '@/lib/data/media';
import { fetchMultipleYouTubeMetadata, YouTubeVideoMetadata } from '@/lib/youtube';
import VideoCard from './VideoCard';
import { YouTubeVideo } from '@/lib/rss';

// Adapter function to convert Media to YouTubeVideo format with metadata
function mediaToYouTubeVideo(media: Media, metadata?: YouTubeVideoMetadata): YouTubeVideo & { channel?: string } {
  // If we have metadata from YouTube API, use it
  if (metadata) {
    return {
      title: metadata.title,
      link: media.url,
      pubDate: metadata.publishDate || media.created_at || new Date().toISOString(),
      videoId: metadata.videoId,
      thumbnail: metadata.thumbnail,
      description: media.description || '',
      channel: metadata.channelName
    };
  }
  
  // Fallback to basic extraction without API call
  let videoId = 'unknown';
  const regularMatch = media.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  const shortsMatch = media.url.match(/youtube\.com\/shorts\/([^&\n?#]+)/);
  
  if (regularMatch) {
    videoId = regularMatch[1];
  } else if (shortsMatch) {
    videoId = shortsMatch[1];
  }
  
  // Generate a better title if none exists
  const generateTitleFromUrl = (): string => {
    if (videoId !== 'unknown') {
      return `YouTube Video - ${videoId}`;
    }
    return 'Video';
  };

  return {
    title: media.title || media.caption || generateTitleFromUrl(),
    link: media.url,
    pubDate: media.created_at || new Date().toISOString(),
    videoId,
    thumbnail: media.thumbnail_url || (videoId !== 'unknown' ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : ''),
    description: media.description || '',
    channel: media.source || undefined
  };
}

interface VideoGridProps {
  videos: Media[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  const [videoMetadata, setVideoMetadata] = useState<Map<string, YouTubeVideoMetadata>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetadata() {
      if (videos.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const metadata = await fetchMultipleYouTubeMetadata(videos);
        setVideoMetadata(metadata);
      } catch (error) {
        console.error('Error loading video metadata:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMetadata();
  }, [videos]);

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="font-bold media-title mb-4">Videos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <div key={video.id} className="animate-pulse">
              <div className="w-full h-48 bg-gray-300 rounded-t-lg"></div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="font-bold media-title mb-4">Videos</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => {
          const metadata = videoMetadata.get(video.url);
          return (
            <VideoCard 
              key={video.id} 
              video={mediaToYouTubeVideo(video, metadata)} 
              showDate={false}
            />
          );
        })}
      </div>
    </div>
  );
}
