import { fetchSpursWomenNews, fetchSpursWomenVideos } from '@/lib/rss';
import { createCachedFunction, CACHE_TTL, CACHE_TAGS, CACHE_KEYS } from './cache-utils';
import { NewsArticle, YouTubeVideo } from '@/lib/rss';

// Raw fetch functions
async function fetchSpursWomenNewsFromAPI(): Promise<NewsArticle[]> {
  try {
    const news = await fetchSpursWomenNews();
    return news;
  } catch (error) {
    console.error('Error fetching Spurs Women news:', error);
    throw error;
  }
}

async function fetchSpursWomenVideosFromAPI(): Promise<YouTubeVideo[]> {
  try {
    const videos = await fetchSpursWomenVideos();
    return videos;
  } catch (error) {
    console.error('Error fetching Spurs Women videos:', error);
    throw error;
  }
}

async function fetchPodcastsFromAPI(): Promise<any[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/podcasts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch podcasts: ${response.status}`);
    }
    const data = await response.json();
    return data.episodes || [];
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    throw error;
  }
}

// Cached functions
export const getSpursWomenNews = createCachedFunction(
  fetchSpursWomenNewsFromAPI,
  {
    keyParts: [CACHE_KEYS.news('spurs-women')],
    tags: [CACHE_TAGS.NEWS],
    revalidate: 60 * 60, // 1 hour instead of 24 hours for better performance
  }
);

export const getSpursWomenVideos = createCachedFunction(
  fetchSpursWomenVideosFromAPI,
  {
    keyParts: [CACHE_KEYS.videos()],
    tags: [CACHE_TAGS.VIDEOS],
    revalidate: CACHE_TTL.YOUTUBE_VIDEOS,
  }
);

export const getPodcasts = createCachedFunction(
  fetchPodcastsFromAPI,
  {
    keyParts: [CACHE_KEYS.podcasts()],
    tags: [CACHE_TAGS.PODCASTS],
    revalidate: CACHE_TTL.RSS_FEEDS,
  }
);

// Helper functions for specific use cases
export async function getHomePageContent() {
  const [news, videos, podcasts] = await Promise.all([
    getSpursWomenNews(),
    getSpursWomenVideos(),
    getPodcasts()
  ]);

  return {
    news: news.slice(0, 6), // Limit to 6 for home page
    videos,
    podcasts: podcasts.slice(0, 2) // Limit to 2 for home page
  };
}
