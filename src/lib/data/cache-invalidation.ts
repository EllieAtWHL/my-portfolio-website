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

export function invalidatePlayerCache() {
  revalidateCacheTags([CACHE_TAGS.PLAYERS]);
  console.log('Invalidated player cache');
}

export function invalidateTeamCache() {
  revalidateCacheTags([CACHE_TAGS.TEAMS]);
  console.log('Invalidated team cache');
}

// Squad membership (joined_on/left_on/squad_number) is read by both a
// player's own profile/index pages (PLAYERS) and a team's roster tabs
// (TEAMS), so a player_history write needs to invalidate both.
export function invalidatePlayerHistoryCache() {
  const tagsToInvalidate = [CACHE_TAGS.PLAYERS, CACHE_TAGS.TEAMS];
  revalidateCacheTags(tagsToInvalidate);
  console.log('Invalidated player history cache tags:', tagsToInvalidate);
}

// Match lineups/appearances (getPlayersByMatch, getTeamLineupsByMatch,
// getPlayerMatchHistory) are tagged with both MATCHES and PLAYERS, so a
// player_stats write needs to invalidate both.
export function invalidatePlayerStatsCache() {
  const tagsToInvalidate = [CACHE_TAGS.PLAYERS, CACHE_TAGS.MATCHES];
  revalidateCacheTags(tagsToInvalidate);
  console.log('Invalidated player stats cache tags:', tagsToInvalidate);
}

// Matches embed a stadium's display name via the matches_with_stadium view,
// so a stadium write needs to invalidate MATCHES too, not just STADIUMS.
export function invalidateStadiumCache() {
  const tagsToInvalidate = [CACHE_TAGS.STADIUMS, CACHE_TAGS.MATCHES];
  revalidateCacheTags(tagsToInvalidate);
  console.log('Invalidated stadium cache tags:', tagsToInvalidate);
}

// A stadium name change affects the same embedded-in-matches display name as
// invalidateStadiumCache, plus the dedicated STADIUM_NAMES-tagged history read.
export function invalidateStadiumNamesCache() {
  const tagsToInvalidate = [CACHE_TAGS.STADIUM_NAMES, CACHE_TAGS.STADIUMS, CACHE_TAGS.MATCHES];
  revalidateCacheTags(tagsToInvalidate);
  console.log('Invalidated stadium names cache tags:', tagsToInvalidate);
}

export function invalidateAllRelatedCaches() {
  const allTags = Object.values(CACHE_TAGS);
  revalidateCacheTags(allTags);
  console.log('Invalidated all cache tags:', allTags);
}

export function invalidateCacheByEntityType(
  entityType: 'match' | 'season' | 'media' | 'news' | 'video' | 'player' | 'team' | 'playerHistory' | 'playerStats' | 'stadium' | 'stadiumName'
) {
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
    case 'player':
      invalidatePlayerCache();
      break;
    case 'team':
      invalidateTeamCache();
      break;
    case 'playerHistory':
      invalidatePlayerHistoryCache();
      break;
    case 'playerStats':
      invalidatePlayerStatsCache();
      break;
    case 'stadium':
      invalidateStadiumCache();
      break;
    case 'stadiumName':
      invalidateStadiumNamesCache();
      break;
    default:
      console.warn(`Unknown entity type for cache invalidation: ${entityType}`);
  }
}
