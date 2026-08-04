import { createCachedFunction, CACHE_TTL, CACHE_TAGS } from './cache-utils';
import { buildMatchQuery, buildMatchNavQuery } from './query-builders';

export interface Match {
  id: string;
  date: string;
  kickoff_time: string | null;
  home_team: {
    id: number;
    name: string;
    short_name: string;
    primary_color: string | null;
    secondary_color: string | null;
    is_tottenham: boolean;
  } | null;
  away_team: {
    id: number;
    name: string;
    short_name: string;
    primary_color: string | null;
    secondary_color: string | null;
    is_tottenham: boolean;
  } | null;
  spurs_score?: number | null;
  opponent_score?: number | null;
  spurs_score_aet?: number | null;
  opponent_score_aet?: number | null;
  spurs_score_pens?: number | null;
  opponent_score_pens?: number | null;
  attended: boolean;
  is_home_match: boolean;
  is_neutral_venue: boolean;
  stadium_id: string;
  stadium_display_name: string | null;
  stadium_slug: string | null;
  attendance: number | null;
  notes: string | null;
  competitions?: {
    name: string;
    icon_svg?: string;
  } | null;
  season_id: number;
  // Match statistics
  home_possession: number | null;
  away_possession: number | null;
  home_total_shots: number | null;
  away_total_shots: number | null;
  home_shots_on_target: number | null;
  away_shots_on_target: number | null;
  home_corners: number | null;
  away_corners: number | null;
}

// Minimal shape needed to render a previous/next match nav link
export interface MatchNavSummary {
  id: string;
  date: string;
  home_team: {
    id: number;
    name: string;
    short_name: string;
  } | null;
  away_team: {
    id: number;
    name: string;
    short_name: string;
  } | null;
}

async function fetchUpcomingMatchesFromDB(limit: number = 3): Promise<Match[]> {
  const now = new Date();
  // Use UTC date to avoid timezone issues
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  
  // First fetch: Get today's matches WITHOUT scores (unscored matches)
  const { data, error } = await buildMatchQuery()
    .gte('date', todayUTC.toISOString())
    .lt('date', tomorrowUTC.toISOString())
    .is('spurs_score', null)
    .is('opponent_score', null)
    .order('date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching upcoming matches:', error);
    throw error;
  }

  // Second fetch: Get future matches (after today)
  const { data: futureData, error: futureError } = await buildMatchQuery()
    .gte('date', tomorrowUTC.toISOString())
    .order('date', { ascending: true })
    .limit(limit - (data?.length || 0));

  if (futureError) {
    console.error('Error fetching future matches:', futureError);
    throw futureError;
  }

  // Combine today's unscored matches and future matches
  const allMatches = [...(data as Match[] || []), ...(futureData as Match[] || [])];
  return allMatches.slice(0, limit);
}

async function fetchPreviousMatchesFromDB(limit: number = 3): Promise<Match[]> {
  const now = new Date();
  // Use UTC date to avoid timezone issues
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  
  // First fetch: Get today's matches that have scores (completed matches)
  const { data: todayData, error: todayError } = await buildMatchQuery()
    .gte('date', todayUTC.toISOString())
    .lt('date', tomorrowUTC.toISOString())
    .not('spurs_score', 'is', null)
    .not('opponent_score', 'is', null)
    .order('date', { ascending: false })
    .limit(limit);

  if (todayError) {
    console.error('Error fetching today\'s completed matches:', todayError);
    throw todayError;
  }

  // Second fetch: Get matches before today (only if we still need more matches)
  const { data, error } = await buildMatchQuery()
    .lt('date', todayUTC.toISOString())
    .order('date', { ascending: false })
    .limit(limit - (todayData?.length || 0));

  if (error) {
    console.error('Error fetching previous matches:', error);
    throw error;
  }

  // Combine both sets of matches with today's matches first (more recent), then limit
  const allMatches = [...(todayData as Match[] || []), ...(data as Match[] || [])];
  return allMatches.slice(0, limit);
}

async function fetchAllMatchesFromDB(filter?: 'upcoming' | 'previous'): Promise<Match[]> {
  let query = buildMatchQuery()
    .order('date', { ascending: false });

  const now = new Date().toISOString();
  
  if (filter === 'upcoming') {
    query = query.gte('date', now);
  } else if (filter === 'previous') {
    query = query.lt('date', now);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching all matches:', error);
    throw error;
  }

  return data as Match[] || [];
}

async function fetchSeasonMatchesFromDB(seasonId: string): Promise<Match[]> {
  const { data, error } = await buildMatchQuery()
    .eq('season_id', seasonId)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching season matches:', error);
    throw error;
  }

  return data as Match[] || [];
}

export const getUpcomingMatches = createCachedFunction(
  fetchUpcomingMatchesFromDB,
  {
    keyParts: ['matches', 'upcoming'],
    tags: [CACHE_TAGS.UPCOMING_MATCHES, CACHE_TAGS.MATCHES],
    revalidate: CACHE_TTL.CURRENT_SEASON_MATCHES,
  }
);

export const getPreviousMatches = createCachedFunction(
  fetchPreviousMatchesFromDB,
  {
    keyParts: ['matches', 'previous'],
    tags: [CACHE_TAGS.PREVIOUS_MATCHES, CACHE_TAGS.MATCHES],
    revalidate: CACHE_TTL.CURRENT_SEASON_MATCHES,
  }
);

export const getAllMatches = createCachedFunction(
  fetchAllMatchesFromDB,
  {
    keyParts: ['matches', 'all'],
    tags: [CACHE_TAGS.MATCHES],
    revalidate: CACHE_TTL.CURRENT_SEASON_MATCHES,
  }
);

export const getSeasonMatches = createCachedFunction(
  fetchSeasonMatchesFromDB,
  {
    keyParts: ['matches', 'season'],
    tags: [CACHE_TAGS.MATCHES],
    revalidate: CACHE_TTL.PAST_SEASONS,
  }
);

export async function getHomePageMatches() {
  const [upcoming, previous] = await Promise.all([
    getUpcomingMatches(3),
    getPreviousMatches(3)
  ]);

  return {
    upcoming,
    previous
  };
}

export async function getMatchesWithFilter(filter?: 'all' | 'upcoming' | 'previous') {
  return getAllMatches(filter === 'all' ? undefined : filter);
}

export async function getMatchesBySeason(seasonId: string) {
  return getSeasonMatches(seasonId);
}

async function fetchMatchByIdFromDB(matchId: string): Promise<Match | null> {
  // Use matches_with_stadium to get stadium information
  const { data, error } = await buildMatchQuery()
    .eq('id', matchId)
    .single();

  if (error) {
    console.error('Error fetching match:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Ensure stats fields exist for compatibility
  if (data.home_possession === undefined) data.home_possession = null;
  if (data.away_possession === undefined) data.away_possession = null;
  if (data.home_total_shots === undefined) data.home_total_shots = null;
  if (data.away_total_shots === undefined) data.away_total_shots = null;
  if (data.home_shots_on_target === undefined) data.home_shots_on_target = null;
  if (data.away_shots_on_target === undefined) data.away_shots_on_target = null;
  if (data.home_corners === undefined) data.home_corners = null;
  if (data.away_corners === undefined) data.away_corners = null;
  if (data.is_neutral_venue === undefined) data.is_neutral_venue = false;

  return data as Match;
}

async function fetchAdjacentMatchesFromDB(matchId: string, currentMatchDate: string): Promise<{ previous: MatchNavSummary | null; next: MatchNavSummary | null }> {
  const [{ data: previousData, error: previousError }, { data: nextData, error: nextError }] = await Promise.all([
    buildMatchNavQuery()
      .lt('date', currentMatchDate)
      .order('date', { ascending: false })
      .limit(1)
      .single(),
    buildMatchNavQuery()
      .gt('date', currentMatchDate)
      .order('date', { ascending: true })
      .limit(1)
      .single(),
  ]);

  // A "no rows" error here is expected for the first/last match in a season
  // (there's genuinely no earlier/later match) - only log, don't throw, so
  // navigation still degrades gracefully to a missing prev/next link.
  if (previousError) {
    console.error('Error fetching previous adjacent match:', previousError);
  }
  if (nextError) {
    console.error('Error fetching next adjacent match:', nextError);
  }

  return {
    previous: previousData as MatchNavSummary | null,
    next: nextData as MatchNavSummary | null,
  };
}

export const getMatchById = createCachedFunction(
  fetchMatchByIdFromDB,
  {
    keyParts: ['match', 'id'],
    tags: [CACHE_TAGS.MATCHES],
    revalidate: CACHE_TTL.CURRENT_SEASON_MATCHES,
  }
);

export const getAdjacentMatches = createCachedFunction(
  fetchAdjacentMatchesFromDB,
  {
    keyParts: ['match', 'adjacent'],
    tags: [CACHE_TAGS.MATCHES],
    revalidate: CACHE_TTL.CURRENT_SEASON_MATCHES,
  }
);
