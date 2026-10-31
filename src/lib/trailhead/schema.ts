// Hand-written validation of the Trailhead profile GraphQL response (zod isn't
// a dependency). The endpoint is unofficial and has no introspection, so the
// shape here is only what WEB-230's recorded fixtures show; anything else is
// reported as UPSTREAM_CHANGED rather than guessed at.
import { TrailheadError } from './errors';

export interface TrailheadAward {
  id: string;
  title: string;
  type: string;
  icon: string | null;
  webUrl: string | null;
}

export interface TrailheadProfile {
  name: string | null;
  avatarUrl: string | null;
}

export interface BadgePage {
  profile: TrailheadProfile;
  awards: TrailheadAward[];
  hasNextPage: boolean;
  endCursor: string | null;
}

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function changed(reason: string): TrailheadError {
  console.error(`Trailhead response failed validation: ${reason}`);
  return new TrailheadError('UPSTREAM_CHANGED', `Trailhead response failed validation: ${reason}`);
}

function errorCodes(errors: unknown[]): string[] {
  return errors.map((error) =>
    isObject(error) && isObject(error.extensions) && typeof error.extensions.code === 'string'
      ? error.extensions.code
      : 'UNKNOWN'
  );
}

function parseAward(node: unknown): TrailheadAward {
  if (!isObject(node)) {
    throw changed('award edge has no node');
  }
  // Trailhead silently returns `award: null` when a page is too big (seen
  // above ~50). Skipping it would show an earned badge as missing, so any
  // null award fails the whole lookup.
  if (node.award === null) {
    throw changed('award is null (awards were dropped)');
  }
  const award = node.award;
  if (!isObject(award) || typeof award.id !== 'string' || typeof award.title !== 'string' || typeof award.type !== 'string') {
    throw changed('award is missing id, title or type');
  }
  if (!isNullableString(award.icon ?? null)) {
    throw changed('award icon is not a string');
  }
  const content = award.content ?? null;
  if (content !== null && !(isObject(content) && isNullableString(content.webUrl ?? null))) {
    throw changed('award content is malformed');
  }

  return {
    id: award.id,
    title: award.title,
    type: award.type,
    icon: (award.icon as string | null | undefined) ?? null,
    webUrl: content ? ((content.webUrl as string | null | undefined) ?? null) : null,
  };
}

/** Parses one GetTrailheadBadges response body, or throws a TrailheadError. */
export function parseBadgePage(body: unknown): BadgePage {
  if (!isObject(body)) {
    throw changed('body is not a JSON object');
  }

  if (Array.isArray(body.errors) && body.errors.length > 0) {
    const codes = errorCodes(body.errors);
    if (codes.includes('TOO_MANY_REQUESTS')) {
      throw new TrailheadError('RATE_LIMITED', 'Trailhead rate limit reached');
    }
    if (codes.includes('NOT_FOUND')) {
      throw new TrailheadError('NOT_FOUND', 'Trailhead profile not found');
    }
    // Includes `undefinedField` (a field we query was removed) and the
    // "exceeds max complexity" rejection for oversized pages.
    throw changed(`GraphQL errors: ${codes.join(', ')}`);
  }

  if (!isObject(body.data) || !isObject(body.data.profile)) {
    throw changed('data.profile is missing');
  }

  const profile = body.data.profile;
  if (profile.__typename === 'PrivateProfile') {
    throw new TrailheadError('PRIVATE_PROFILE', 'Trailhead profile is private');
  }
  if (profile.__typename !== 'PublicProfile') {
    throw changed(`unexpected profile type ${String(profile.__typename)}`);
  }
  if (!isNullableString(profile.name ?? null) || !isNullableString(profile.avatarUrl ?? null)) {
    throw changed('profile name or avatarUrl is not a string');
  }

  const earned = profile.earnedAwards;
  if (!isObject(earned) || !Array.isArray(earned.edges) || !isObject(earned.pageInfo)) {
    throw changed('earnedAwards is malformed');
  }
  const { hasNextPage, endCursor } = earned.pageInfo;
  if (typeof hasNextPage !== 'boolean' || !isNullableString(endCursor ?? null)) {
    throw changed('pageInfo is malformed');
  }
  if (hasNextPage && !endCursor) {
    throw changed('hasNextPage without an endCursor');
  }

  return {
    profile: {
      name: (profile.name as string | null | undefined) ?? null,
      avatarUrl: (profile.avatarUrl as string | null | undefined) ?? null,
    },
    awards: earned.edges.map((edge) => parseAward(isObject(edge) ? edge.node : undefined)),
    hasNextPage,
    endCursor: (endCursor as string | null | undefined) ?? null,
  };
}
