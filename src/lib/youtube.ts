import { Media } from '@/types/media';

export interface YouTubeVideoMetadata {
  title: string;
  channelName: string;
  thumbnail: string;
  videoId: string;
}

// Function to extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  // Handle various YouTube URL formats including Shorts
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Function to fetch YouTube video metadata using oEmbed API
export async function fetchYouTubeMetadata(url: string): Promise<YouTubeVideoMetadata | null> {
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    return null;
  }

  try {
    // Use YouTube oEmbed API to get basic metadata
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch YouTube metadata:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    return {
      title: data.title || `YouTube Video: ${videoId}`,
      channelName: data.author_name || 'Unknown Channel',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      videoId
    };
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    return null;
  }
}

// Function to get basic metadata without API call (fallback)
export function getBasicYouTubeMetadata(url: string, caption?: string | null): YouTubeVideoMetadata | null {
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    return null;
  }

  return {
    title: caption || `YouTube Video: ${videoId}`,
    channelName: 'YouTube',
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    videoId
  };
}

// Function to batch fetch metadata for multiple videos
export async function fetchMultipleYouTubeMetadata(videos: Media[]): Promise<Map<string, YouTubeVideoMetadata>> {
  const metadataMap = new Map<string, YouTubeVideoMetadata>();
  
  // Fetch metadata for all videos in parallel
  const promises = videos.map(async (video) => {
    try {
      const metadata = await fetchYouTubeMetadata(video.url);
      if (metadata) {
        metadataMap.set(video.url, metadata);
      } else {
        // Fallback to basic metadata
        const basicMetadata = getBasicYouTubeMetadata(video.url, video.caption);
        if (basicMetadata) {
          metadataMap.set(video.url, basicMetadata);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch metadata for video ${video.id}:`, error);
      // Fallback to basic metadata
      const basicMetadata = getBasicYouTubeMetadata(video.url, video.caption);
      if (basicMetadata) {
        metadataMap.set(video.url, basicMetadata);
      }
    }
  });

  await Promise.all(promises);
  
  return metadataMap;
}
