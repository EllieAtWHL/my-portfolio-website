import { unstable_cache } from 'next/cache';

export class CacheError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'CacheError';
  }
}

// Cache TTL constants in seconds
export const CACHE_TTL = {
  STATIC_CONTENT: 24 * 60 * 60, // 24 hours
  CURRENT_SEASON_MATCHES: 30 * 60, // 30 minutes
  LIVE_MATCH_DATA: 5 * 60, // 5 minutes
  PAST_SEASONS: 7 * 24 * 60 * 60, // 7 days
  YOUTUBE_VIDEOS: 60 * 60, // 1 hour
  RSS_FEEDS: 24 * 60 * 60, // 24 hours
  MEDIA: 6 * 60 * 60, // 6 hours
  STADIUM_DATA: 24 * 60 * 60, // 24 hours
  PLAYER_DATA: 60 * 60, // 1 hour
  PLAYER_STATS: 30 * 60, // 30 minutes
  TEAM_DATA: 24 * 60 * 60, // 24 hours
} as const;

export type CacheTTLDuration = keyof typeof CACHE_TTL;

export const CACHE_TAGS = {
  MATCHES: 'matches',
  UPCOMING_MATCHES: 'upcoming-matches',
  PREVIOUS_MATCHES: 'previous-matches',
  SEASONS: 'seasons',
  NEWS: 'news',
  VIDEOS: 'videos',
  PODCASTS: 'podcasts',
  MEDIA: 'media',
  STADIUMS: 'stadiums',
  STADIUM_NAMES: 'stadium-names',
  PLAYERS: 'players',
  PLAYER_STATS: 'player-stats',
  TEAMS: 'teams',
} as const;

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];

export const CACHE_KEYS = {
  matches: (season?: string, competition?: string, variant?: string) => 
    `matches${season ? `:${season}` : ''}${competition ? `:${competition}` : ''}${variant ? `:${variant}` : ''}`,
  seasonSummary: (season: string) => `season-summary:${season}`,
  article: (slug: string) => `article:slug:${slug}`,
  news: (source?: string) => `news${source ? `:${source}` : ''}`,
  videos: () => 'videos:spurs-women',
  podcasts: () => 'podcasts:spurs-related',
  stadium: (slug: string) => `stadium:${slug}`,
  stadiumNames: (stadiumId: string) => `stadium-names:${stadiumId}`,
} as const;

export interface CacheOptions {
  keyParts: string[];
  tags: CacheTag[];
  revalidate?: number;
  ttl?: CacheTTLDuration;
}

export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CacheOptions
): T {
  const cachedFn = unstable_cache(fn, options.keyParts, {
    tags: options.tags,
    revalidate: options.revalidate || (options.ttl ? CACHE_TTL[options.ttl] : CACHE_TTL.STATIC_CONTENT),
  });

  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    const cacheKey = options.keyParts.join(':');
    
    try {
      if (typeof window === 'undefined') {
        const result = await cachedFn(...args);
        console.log(`Cache HIT: ${cacheKey} in ${Date.now() - startTime}ms`);
        return result;
      } else {
        console.log(`Cache BYPASS (client-side): ${cacheKey}`);
        const result = await fn(...args);
        return result;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Cache ERROR: ${cacheKey} after ${duration}ms:`, error);
      
      try {
        console.log(`Cache FALLBACK: Fetching fresh data for ${cacheKey}`);
        const result = await fn(...args);
        return result;
      } catch (fallbackError) {
        console.error(`Cache FALLBACK FAILED: ${cacheKey}:`, fallbackError);
        throw new CacheError(
          `Both cache and direct fetch failed for ${cacheKey}`,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }) as T;
}
