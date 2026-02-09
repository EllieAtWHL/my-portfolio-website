import { unstable_cache } from 'next/cache';

// Cache TTL constants in seconds
export const CACHE_TTL = {
  STATIC_CONTENT: 24 * 60 * 60, // 24 hours
  CURRENT_SEASON_MATCHES: 30 * 60, // 30 minutes
  LIVE_MATCH_DATA: 5 * 60, // 5 minutes
  PAST_SEASONS: 7 * 24 * 60 * 60, // 7 days
  YOUTUBE_VIDEOS: 60 * 60, // 1 hour
  RSS_FEEDS: 24 * 60 * 60, // 24 hours
  MEDIA: 6 * 60 * 60, // 6 hours
} as const;

// Cache tags for revalidation
export const CACHE_TAGS = {
  MATCHES: 'matches',
  UPCOMING_MATCHES: 'upcoming-matches',
  PREVIOUS_MATCHES: 'previous-matches',
  SEASONS: 'seasons',
  NEWS: 'news',
  VIDEOS: 'videos',
  PODCASTS: 'podcasts',
  MEDIA: 'media',
} as const;

// Cache key patterns following the brief: <entity>:<season>:<competition>:<variant>
export const CACHE_KEYS = {
  matches: (season?: string, competition?: string, variant?: string) => 
    `matches${season ? `:${season}` : ''}${competition ? `:${competition}` : ''}${variant ? `:${variant}` : ''}`,
  seasonSummary: (season: string) => `season-summary:${season}`,
  article: (slug: string) => `article:slug:${slug}`,
  news: (source?: string) => `news${source ? `:${source}` : ''}`,
  videos: () => 'videos:spurs-women',
  podcasts: () => 'podcasts:spurs-related',
} as const;

/**
 * Creates a cached function with proper error handling and stale-while-revalidate behavior
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyParts: string[];
    tags: string[];
    revalidate?: number;
    ttl?: number;
  }
): T {
  const cachedFn = unstable_cache(fn, options.keyParts, {
    tags: options.tags,
    revalidate: options.revalidate || options.ttl || CACHE_TTL.STATIC_CONTENT,
  });

  return (async (...args: Parameters<T>) => {
    try {
      // Only use cache on server side
      if (typeof window === 'undefined') {
        const result = await cachedFn(...args);
        return result;
      } else {
        // On client side, call the function directly
        const result = await fn(...args);
        return result;
      }
    } catch (error) {
      console.error(`Cache error for key parts ${options.keyParts.join(':')}:`, error);
      // Return empty array on error to prevent page crashes
      return [];
    }
  }) as T;
}
