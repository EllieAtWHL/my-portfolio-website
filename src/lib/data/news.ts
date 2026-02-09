import { fetchSpursWomenNews, fetchSpursWomenVideos } from '@/lib/rss';
import { createCachedFunction, CACHE_TTL, CACHE_TAGS, CACHE_KEYS } from './cache-utils';
import { NewsArticle, YouTubeVideo } from '@/lib/rss';
import { getHomePageMatches } from './matches';

// Podcast fetching logic extracted from API route
interface PodcastEpisode {
  title: string;
  episodeNumber: string;
  description: string;
  duration: string;
  publishDate: string;
  url: string;
  podcastName: string;
}

interface PodcastFeed {
  name: string;
  rssUrl: string;
  latestEpisodeUrl: string;
}

const PODCAST_FEEDS: PodcastFeed[] = [
  {
    name: 'N17 Women',
    rssUrl: 'https://feeds.acast.com/public/shows/62af54f51783a000139efa2f',
    latestEpisodeUrl: 'https://shows.acast.com/n17women'
  },
  {
    name: 'Hometown Glory',
    rssUrl: 'https://feeds.acast.com/public/shows/6166a5b881a77f0012f27d9e',
    latestEpisodeUrl: 'https://open.spotify.com/show/7meFK8F2RWHACIHjoRqso9'
  }
];

async function fetchRSSFeed(url: string, feedUrl: string): Promise<any> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PodcastAggregator/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Find the first <item> tag
    const itemStartIndex = text.indexOf('<item>');
    if (itemStartIndex === -1) {
      throw new Error('No items found in RSS feed');
    }
    
    const itemEndIndex = text.indexOf('</item>', itemStartIndex);
    if (itemEndIndex === -1) {
      throw new Error('Malformed item tag in RSS feed');
    }
    
    const itemContent = text.substring(itemStartIndex + 6, itemEndIndex);
    
    // Extract title (handle both CDATA and plain text)
    const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || 
                      itemContent.match(/<title>(.*?)<\/title>/);
    
    // Extract description (handle both CDATA and plain text, strip HTML)
    const descriptionMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || 
                           itemContent.match(/<description>(.*?)<\/description>/);
    
    // Extract link (prefer acast:episodeUrl for proper episode links)
    const episodeUrlMatch = itemContent.match(/<acast:episodeUrl>(.*?)<\/acast:episodeUrl>/);
    const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
    
    // Extract publication date
    const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
    
    // Extract duration
    const durationMatch = itemContent.match(/<itunes:duration>(.*?)<\/itunes:duration>/);
    
    // Extract enclosure (audio file URL)
    const enclosureMatch = itemContent.match(/<enclosure[^>]*url="(.*?)"/);
    
    const title = titleMatch ? titleMatch[1].trim() : 'Unknown Title';
    let description = descriptionMatch ? descriptionMatch[1] : 'No description available';
    
    // Strip HTML tags from description
    description = description.replace(/<[^>]*>/g, '').trim();
    if (description.length > 300) {
      description = description.substring(0, 300) + '...';
    }
    
    // Extract show name from the feed to construct proper URLs
    let showName = '';
    if (feedUrl.includes('62af54f51783a000139efa2f')) {
      showName = 'n17women';
    } else if (feedUrl.includes('6166a5b881a77f0012f27d9e')) {
      showName = 'hometown-glory-a-spurs-x-culture-podcast';
    }
    
    // Construct proper episode URL if we have the episode URL slug
    let episodeUrl = '';
    if (episodeUrlMatch && feedUrl.includes('acast.com') && showName) {
      const episodeSlug = episodeUrlMatch[1].trim();
      episodeUrl = `https://shows.acast.com/${showName}/episodes/${episodeSlug}`;
    }
    
    // Fallback to link or enclosure if episode URL construction fails
    if (!episodeUrl) {
      episodeUrl = linkMatch ? linkMatch[1].trim() : (enclosureMatch ? enclosureMatch[1].trim() : '');
    }
    
    return {
      title,
      description,
      url: episodeUrl,
      publishDate: pubDateMatch ? formatDate(new Date(pubDateMatch[1])) : 'Unknown Date',
      duration: durationMatch ? formatDuration(durationMatch[1].trim()) : 'Unknown Duration'
    };
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}:`, error);
    return null;
  }
}

function formatDuration(duration: string): string {
  // Check if duration is already in HH:MM:SS or MM:SS format
  if (duration.includes(':')) {
    // It's already in time format, just normalize it
    const parts = duration.split(':').map(part => parseInt(part.trim()));
    
    if (parts.length === 3) {
      // HH:MM:SS format
      const [hours, minutes, seconds] = parts;
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (parts.length === 2) {
      // MM:SS format
      const [minutes, seconds] = parts;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  // If it's a number of seconds, convert to MM:SS or HH:MM:SS format
  const totalSeconds = parseInt(duration);
  if (isNaN(totalSeconds)) return duration;
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

function formatDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}

function getFallbackDescription(podcastName: string): string {
  switch (podcastName) {
    case 'N17 Women':
      return 'We are a fan-produced podcast about all things Tottenham Hotspur Women. Since 2022, we\'ve been talking about the mighty Spurs Women, from the transfer window to pre-season to cup games and everything in between.';
    case 'Hometown Glory':
      return 'HG is committed to covering both Tottenham men\'s and women\'s teams, tapping into the full Spurs fan experience. Women\'s team coverage is helpfully time-stamped.';
    default:
      return 'Regular coverage of Tottenham Hotspur Women with analysis, interviews, and fan discussion.';
  }
}

async function fetchPodcastsFromAPI(): Promise<PodcastEpisode[]> {
  const episodes: PodcastEpisode[] = [];
  
  for (const feed of PODCAST_FEEDS) {
    try {
      let episode: PodcastEpisode | null = null;
      
      if (feed.rssUrl) {
        // Try to fetch from RSS feed
        const rssData = await fetchRSSFeed(feed.rssUrl, feed.rssUrl);
        if (rssData) {
          episode = {
            title: rssData.title,
            episodeNumber: feed.name,
            description: rssData.description,
            duration: rssData.duration,
            publishDate: rssData.publishDate,
            url: rssData.url,
            podcastName: feed.name
          };
        }
      }
      
      // Fallback to static data if RSS fails or isn't available
      if (!episode) {
        episode = {
          title: 'Current Episode',
          episodeNumber: feed.name,
          description: getFallbackDescription(feed.name),
          duration: 'Varies',
          publishDate: 'Regular Updates',
          url: feed.latestEpisodeUrl,
          podcastName: feed.name
        };
      }
      
      episodes.push(episode);
    } catch (error) {
      console.error(`Error processing ${feed.name}:`, error);
      // Add fallback episode
      episodes.push({
        title: 'Latest Episode',
        episodeNumber: feed.name,
        description: getFallbackDescription(feed.name),
        duration: 'Varies',
        publishDate: 'Regular Updates',
        url: feed.latestEpisodeUrl,
        podcastName: feed.name
      });
    }
  }
  
  return episodes;
}

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

// Cached functions
export const getSpursWomenNews = createCachedFunction(
  fetchSpursWomenNewsFromAPI,
  {
    keyParts: [CACHE_KEYS.news('spurs-women')],
    tags: [CACHE_TAGS.NEWS],
    revalidate: CACHE_TTL.RSS_FEEDS, // Use the standardized TTL constant
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
  const [matches, news, videos, podcasts] = await Promise.all([
    getHomePageMatches(),
    getSpursWomenNews(),
    getSpursWomenVideos(),
    getPodcasts()
  ]);

  return {
    upcoming: matches.upcoming,
    previous: matches.previous,
    news: news.slice(0, 6), // Limit to 6 for home page
    videos,
    podcasts: podcasts.slice(0, 2) // Limit to 2 for home page
  };
}
