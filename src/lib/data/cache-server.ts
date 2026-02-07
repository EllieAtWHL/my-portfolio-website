import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from './cache-utils';

/**
 * Server-only cache revalidation functions
 * These should only be imported and used in server components or API routes
 */

/**
 * Revalidates cache by tag - server only
 */
export function revalidateCacheTag(tag: string) {
  revalidateTag(tag, {});
}

/**
 * Revalidates multiple cache tags - server only
 */
export function revalidateCacheTags(tags: string[]) {
  tags.forEach(tag => revalidateTag(tag, {}));
}

/**
 * Revalidate all cache tags - server only
 */
export function revalidateAllCache() {
  const allTags = Object.values(CACHE_TAGS);
  revalidateCacheTags(allTags);
  return allTags;
}
