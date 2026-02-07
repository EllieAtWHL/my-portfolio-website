import { supabase } from '@/utils/supabase';
import { createCachedFunction, CACHE_TTL, CACHE_TAGS, CACHE_KEYS } from './cache-utils';

export interface Match {
  id: number;
  date: string;
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
  attended: boolean;
  is_home_match: boolean;
  competitions?: {
    name: string;
    icon_svg?: string;
  } | null;
  season_id: number;
}

// Raw database fetch functions
async function fetchUpcomingMatchesFromDB(limit: number = 3): Promise<Match[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
      away_team:away_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
      competitions(name, icon_svg)
    `)
    .gte('date', today.toISOString())
    .lt('date', tomorrow.toISOString())
    .or('spurs_score.is.null,opponent_score.is.null')
    .order('date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching upcoming matches:', error);
    throw error;
  }

  // Also fetch future matches beyond today
  const { data: futureData, error: futureError } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
      away_team:away_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
      competitions(name, icon_svg)
    `)
    .gte('date', tomorrow.toISOString())
    .order('date', { ascending: true })
    .limit(limit - (data?.length || 0));

  if (futureError) {
    console.error('Error fetching future matches:', futureError);
    throw futureError;
  }

  const allMatches = [...(data as Match[] || []), ...(futureData as Match[] || [])];
  return allMatches.slice(0, limit);
}

async function fetchPreviousMatchesFromDB(limit: number = 3): Promise<Match[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Fetch matches before today
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
      away_team:away_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
      competitions(name, icon_svg)
    `)
    .lt('date', today.toISOString())
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching previous matches:', error);
    throw error;
  }

  // Fetch today's matches that have scores
  const { data: todayData, error: todayError } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
      away_team:away_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
      competitions(name, icon_svg)
    `)
    .gte('date', today.toISOString())
    .lt('date', tomorrow.toISOString())
    .not('spurs_score', 'is', null)
    .not('opponent_score', 'is', null)
    .order('date', { ascending: false })
    .limit(limit - (data?.length || 0));

  if (todayError) {
    console.error('Error fetching today\'s completed matches:', todayError);
    throw todayError;
  }

  const allMatches = [...(data as Match[] || []), ...(todayData as Match[] || [])];
  return allMatches.slice(0, limit);
}

async function fetchAllMatchesFromDB(filter?: 'upcoming' | 'previous'): Promise<Match[]> {
  let query = supabase
    .from('matches')
    .select(`
      *,
      home_team:home_team_id (*),
      away_team:away_team_id (*),
      competitions:competition_id (*)
    `)
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

async function fetchSeasonMatchesFromDB(seasonId: number): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:home_team_id (*),
      away_team:away_team_id (*),
      competitions:competition_id (*)
    `)
    .eq('season_id', seasonId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching season matches:', error);
    throw error;
  }

  return data as Match[] || [];
}

// Cached functions using the cache utilities
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

// Helper functions for specific use cases
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

export async function getMatchesBySeason(seasonId: number) {
  return getSeasonMatches(seasonId);
}
