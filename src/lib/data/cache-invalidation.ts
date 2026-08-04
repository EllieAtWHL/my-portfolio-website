import { revalidateCacheTags } from './cache-server';
import { CACHE_TAGS } from './cache-utils';

export function invalidateMatchCache() {
  const tagsToInvalidate = [CACHE_TAGS.MATCHES];
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

export function invalidateAllRelatedCaches() {
  const allTags = Object.values(CACHE_TAGS);
  revalidateCacheTags(allTags);
  console.log('Invalidated all cache tags:', allTags);
}

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
