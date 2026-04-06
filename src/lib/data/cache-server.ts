import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from './cache-utils';

export function revalidateCacheTag(tag: string) {
  revalidateTag(tag, {});
}

export function revalidateCacheTags(tags: string[]) {
  tags.forEach(tag => revalidateTag(tag, {}));
}

export function revalidateAllCache() {
  const allTags = Object.values(CACHE_TAGS);
  revalidateCacheTags(allTags);
  return allTags;
}
