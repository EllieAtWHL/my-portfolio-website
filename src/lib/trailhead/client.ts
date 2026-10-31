// Client for Trailhead's unofficial profile GraphQL API - the one Trailhead's
// own profile pages use. Server-side only: the browser never calls Trailhead.
// Limits come from the WEB-230 live findings (plan doc, "Live API findings").
import { TrailheadError } from './errors';
import { parseBadgePage, type TrailheadAward, type TrailheadProfile } from './schema';

export const TRAILHEAD_GRAPHQL_URL = 'https://profile.api.trailhead.com/graphql';

// Pages above ~50 silently drop awards (`award: null`), and 200+ is rejected
// outright for query complexity.
export const PAGE_SIZE = 50;
// 2,000 awards per type. Profiles past this get an `incomplete` result rather
// than a wrong score.
export const MAX_PAGES_PER_TYPE = 40;
export const REQUEST_TIMEOUT_MS = 8000;

// The only award types Trick or Trailhead badges have been issued as.
export const AWARD_TYPES = ['EVENT', 'MODULE'] as const;
export type AwardType = (typeof AWARD_TYPES)[number];

// Kept identical to __tests__/fixtures/query.graphql (a test checks), so the
// recorded fixtures stay representative of what this sends.
export const BADGES_QUERY = `query GetTrailheadBadges($slug: String, $count: Int, $after: String, $filter: AwardTypeFilter) {
  profile(slug: $slug) {
    __typename
    ... on PublicProfile {
      name
      avatarUrl
      earnedAwards(first: $count, after: $after, awardType: $filter) {
        edges { node { __typename id ... on EarnedAwardBase { award { id title type icon content { webUrl } } } } }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}`;

export interface EarnedAwards {
  profile: TrailheadProfile;
  awards: TrailheadAward[];
  /** True if a type hit MAX_PAGES_PER_TYPE before Trailhead ran out of pages. */
  incomplete: boolean;
}

export interface FetchEarnedAwardsOptions {
  /**
   * Called after each page with that type's awards so far. Returning true
   * stops paging that type early - awards come newest first, so once every
   * catalogue badge is found, the remaining pages can't change the result.
   */
  isComplete?: (type: AwardType, awards: TrailheadAward[]) => boolean;
  fetchImpl?: typeof fetch;
}

async function requestPage(
  fetchImpl: typeof fetch,
  username: string,
  type: AwardType,
  after: string | null
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  let body: unknown;
  try {
    response = await fetchImpl(TRAILHEAD_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: BADGES_QUERY,
        variables: { slug: username, count: PAGE_SIZE, after, filter: type },
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    // No Retry-After is sent, and retrying would only spend more of the
    // shared per-IP budget, so a 429 ends the lookup.
    if (response.status === 429) {
      throw new TrailheadError('RATE_LIMITED', 'Trailhead rate limit reached');
    }
    body = await response.json().catch(() => undefined);
    // The timeout can also fire while the body is still downloading.
    if (controller.signal.aborted) {
      throw new TrailheadError('UPSTREAM_UNAVAILABLE', 'Trailhead timed out');
    }
  } catch (error) {
    if (error instanceof TrailheadError) {
      throw error;
    }
    const reason = controller.signal.aborted ? 'timed out' : 'request failed';
    throw new TrailheadError('UPSTREAM_UNAVAILABLE', `Trailhead ${reason}`);
  } finally {
    clearTimeout(timeout);
  }

  // GraphQL errors (NOT_FOUND, TOO_MANY_REQUESTS, undefinedField) can come
  // with any status, so they take priority over the status code.
  const hasGraphqlErrors = typeof body === 'object' && body !== null && 'errors' in body;
  if (response.status >= 500 && !hasGraphqlErrors) {
    throw new TrailheadError('UPSTREAM_UNAVAILABLE', `Trailhead returned HTTP ${response.status}`);
  }
  if (body === undefined) {
    console.error(`Trailhead response failed validation: HTTP ${response.status} body is not JSON`);
    throw new TrailheadError('UPSTREAM_CHANGED', `Trailhead returned HTTP ${response.status} without JSON`);
  }
  const page = parseBadgePage(body);
  if (!response.ok) {
    console.error(`Trailhead response failed validation: unexpected HTTP ${response.status}`);
    throw new TrailheadError('UPSTREAM_CHANGED', `Trailhead returned HTTP ${response.status}`);
  }
  return page;
}

/**
 * Fetches a profile's EVENT and MODULE awards, paging each type in turn.
 * Pages can't be fetched in parallel: the cursor is keyset-based and needs the
 * previous page's last ID. Throws a TrailheadError for every failure.
 */
export async function fetchEarnedAwards(
  username: string,
  { isComplete = () => false, fetchImpl = fetch }: FetchEarnedAwardsOptions = {}
): Promise<EarnedAwards> {
  let profile: TrailheadProfile | null = null;
  const awards: TrailheadAward[] = [];
  let incomplete = false;

  for (const type of AWARD_TYPES) {
    const typeAwards: TrailheadAward[] = [];
    let after: string | null = null;

    for (let pageNumber = 1; ; pageNumber++) {
      const page = await requestPage(fetchImpl, username, type, after);
      profile ??= page.profile;
      typeAwards.push(...page.awards);

      if (!page.hasNextPage || isComplete(type, typeAwards)) {
        break;
      }
      if (pageNumber === MAX_PAGES_PER_TYPE) {
        incomplete = true;
        break;
      }
      after = page.endCursor;
    }

    awards.push(...typeAwards);
  }

  // AWARD_TYPES is non-empty, so at least one page was parsed.
  return { profile: profile as TrailheadProfile, awards, incomplete };
}
