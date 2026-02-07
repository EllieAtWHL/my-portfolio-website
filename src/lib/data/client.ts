// Client-side data fetching functions that call the cached API routes
// These are safe to use in client components

export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  guid: string;
  isoDate: string;
  source?: string;
}

export interface YouTubeVideo {
  title: string;
  link: string;
  pubDate: string;
  videoId: string;
  thumbnail: string;
  description: string;
}

export interface PodcastEpisode {
  title: string;
  episodeNumber: string;
  description: string;
  duration: string;
  publishDate: string;
  url: string;
  podcastName: string;
}

export interface Match {
  id: number;
  date: string;
  home_team: {
    id: number;
    name: string;
    short_name: string;
    primary_color: string | null;
    secondary_color: string | null;
    is_tottenham: boolean;
  } | null;
  away_team: {
    id: number;
    name: string;
    short_name: string;
    primary_color: string | null;
    secondary_color: string | null;
    is_tottenham: boolean;
  } | null;
  spurs_score?: number | null;
  opponent_score?: number | null;
  attended: boolean;
  is_home_match: boolean;
  competitions?: {
    name: string;
    icon_svg?: string;
  } | null;
  season_id: number;
}

// Client-side functions that call the API routes
export async function getUpcomingMatchesClient(limit: number = 3): Promise<Match[]> {
  try {
    const response = await fetch(`/api/cache/matches/upcoming?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch upcoming matches: ${response.status}`);
    }
    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return [];
  }
}

export async function getPreviousMatchesClient(limit: number = 3): Promise<Match[]> {
  try {
    const response = await fetch(`/api/cache/matches/previous?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch previous matches: ${response.status}`);
    }
    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error('Error fetching previous matches:', error);
    return [];
  }
}

export async function getSpursWomenNewsClient(): Promise<NewsArticle[]> {
  try {
    const response = await fetch('/api/spurs-women-news');
    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.status}`);
    }
    const data = await response.json();
    return data.news || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

export async function getSpursWomenVideosClient(): Promise<YouTubeVideo[]> {
  try {
    const response = await fetch('/api/spurs-women-videos');
    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.status}`);
    }
    const data = await response.json();
    return data.videos || [];
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
}

export async function getPodcastsClient(): Promise<PodcastEpisode[]> {
  try {
    const response = await fetch('/api/podcasts');
    if (!response.ok) {
      throw new Error(`Failed to fetch podcasts: ${response.status}`);
    }
    const data = await response.json();
    return data.episodes || [];
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return [];
  }
}

// Helper function for home page
export async function getHomePageContentClient() {
  const [upcoming, previous, news, videos, podcasts] = await Promise.all([
    getUpcomingMatchesClient(3),
    getPreviousMatchesClient(3),
    getSpursWomenNewsClient(),
    getSpursWomenVideosClient(),
    getPodcastsClient()
  ]);

  return {
    upcoming,
    previous,
    news: news.slice(0, 6),
    videos,
    podcasts: podcasts.slice(0, 2)
  };
}
