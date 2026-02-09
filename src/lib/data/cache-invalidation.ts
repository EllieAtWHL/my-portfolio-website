import { revalidateCacheTags } from './cache-server';
import { CACHE_TAGS } from './cache-utils';

/**
 * Automatic cache invalidation utilities
 * These should be called when data is modified in the database
 */

export function invalidateMatchCache(seasonId?: string, competitionId?: string) {
  const tagsToInvalidate = [CACHE_TAGS.MATCHES];
  
  // Add specific tags based on what changed
  if (seasonId) {
    // In a real implementation, you might have season-specific tags
    console.log(`Invalidating match cache for season ${seasonId}`);
  }
  
  if (competitionId) {
    // In a real implementation, you might have competition-specific tags
    console.log(`Invalidating match cache for competition ${competitionId}`);
  }
  
  revalidateCacheTags(tagsToInvalidate);
  console.log('Invalidated match cache tags:', tagsToInvalidate);
}

export function invalidateSeasonCache() {
  revalidateCacheTags([CACHE_TAGS.SEASONS]);
  console.log('Invalidated season cache');
}

export function invalidateMediaCache() {
  revalidateCacheTags([CACHE_TAGS.MEDIA]);
  console.log('Invalidated media cache');
}

export function invalidateNewsCache() {
  revalidateCacheTags([CACHE_TAGS.NEWS]);
  console.log('Invalidated news cache');
}

export function invalidateVideoCache() {
  revalidateCacheTags([CACHE_TAGS.VIDEOS]);
  console.log('Invalidated video cache');
}

/**
 * Invalidate all related caches when content is updated
 */
export function invalidateAllRelatedCaches() {
  const allTags = Object.values(CACHE_TAGS);
  revalidateCacheTags(allTags);
  console.log('Invalidated all cache tags:', allTags);
}

/**
 * Selective cache invalidation based on entity type
 */
export function invalidateCacheByEntityType(entityType: 'match' | 'season' | 'media' | 'news' | 'video') {
  switch (entityType) {
    case 'match':
      invalidateMatchCache();
      break;
    case 'season':
      invalidateSeasonCache();
      break;
    case 'media':
      invalidateMediaCache();
      break;
    case 'news':
      invalidateNewsCache();
      break;
    case 'video':
      invalidateVideoCache();
      break;
    default:
      console.warn(`Unknown entity type for cache invalidation: ${entityType}`);
  }
}
