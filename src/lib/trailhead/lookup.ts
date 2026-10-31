// One Trick or Trailhead lookup: fetch the profile's awards, stopping each
// award type as soon as every catalogue badge of that type is found, then
// score them against the catalogue. Cached per username for 24 hours.
import { CACHE_TAGS, CACHE_TTL, createCachedFunction } from '@/lib/data/cache-utils';
import { CATALOGUE, catalogueVersion, type CatalogueBadge } from './catalogue';
import { fetchEarnedAwards, type FetchEarnedAwardsOptions } from './client';
import { isTrailheadError } from './errors';
import { hasEveryBadge, matchBadges, type TrickOrTrailheadResult } from './match';

export type TrickOrTrailheadLookup =
  | ({ status: 'found' } & TrickOrTrailheadResult)
  | { status: 'not-found' };

export async function lookupTrickOrTrailhead(
  username: string,
  catalogue: CatalogueBadge[] = CATALOGUE,
  fetchImpl?: FetchEarnedAwardsOptions['fetchImpl']
): Promise<TrickOrTrailheadLookup> {
  try {
    const { profile, awards, incomplete } = await fetchEarnedAwards(username, {
      isComplete: (type, typeAwards) =>
        hasEveryBadge(catalogue.filter((badge) => badge.awardType === type), typeAwards),
      fetchImpl,
    });
    return { status: 'found', ...matchBadges(catalogue, awards, profile, incomplete) };
  } catch (error) {
    // Returned rather than thrown so unstable_cache stores it: an unknown
    // username stays unknown, so there's no need to ask Trailhead again.
    if (isTrailheadError(error) && error.code === 'NOT_FOUND') {
      return { status: 'not-found' };
    }
    throw error;
  }
}

// Found and not-found results are values, so they're cached. Every other
// outcome (private profile, rate limited, Trailhead down or changed) is a
// thrown TrailheadError, which unstable_cache doesn't store - so someone who
// makes their profile public can retry straight away - and `rethrow` stops
// createCachedFunction's fallback from repeating the upstream calls.
//
// The username is an argument, not a key part, so unstable_cache keys on it
// but createCachedFunction's logs (which print only keyParts) never show it.
// Bump RESULT_VERSION when TrickOrTrailheadResult's shape changes.
const RESULT_VERSION = 'v1';

export const getTrickOrTrailheadResult = createCachedFunction(
  (username: string) => lookupTrickOrTrailhead(username),
  {
    keyParts: ['trick-or-trailhead', RESULT_VERSION, catalogueVersion()],
    tags: [CACHE_TAGS.TRICK_OR_TRAILHEAD],
    revalidate: CACHE_TTL.STATIC_CONTENT,
    rethrow: isTrailheadError,
  }
);
