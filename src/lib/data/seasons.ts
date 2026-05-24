import { supabase } from '@/utils/supabase';
import { createCachedFunction, CACHE_TTL, CACHE_TAGS } from './cache-utils';
import { getSeasonMatches } from './matches';

export interface Season {
  id: number;
  name: string;
}

export interface SeasonWithMatchCount extends Season {
  match_count?: number;
}

export interface SeasonStatsData {
  seasonId: number;
  seasonName: string;
  winPercentage: number;
  goalsPerGame: number;
  goalsConcededPerGame: number;
  attendancePercentage: number;
  averagePossession: number;
  averageTotalShots: number;
  averageShotsOnTarget: number;
  averageCorners: number;
}

export interface SeasonReview {
  id?: number;
  season_id: number;
  title: string;
  content: string;
  highlights?: string[];
  created_at?: string;
  updated_at?: string;
}

// Raw database fetch functions
async function fetchSeasonsFromDB(): Promise<Season[]> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching seasons:', error);
    throw error;
  }

  return data as Season[] || [];
}

async function fetchSeasonsWithMatchCountsFromDB(): Promise<SeasonWithMatchCount[]> {
  // Fetch seasons first
  const { data: seasonsData, error: seasonsError } = await supabase
    .from('seasons')
    .select('*')
    .order('start_date', { ascending: true });

  if (seasonsError) {
    console.error('Error fetching seasons:', seasonsError);
    throw seasonsError;
  }

  // Fetch match counts for each season
  const seasonsWithCounts = await Promise.all(
    (seasonsData as Season[]).map(async (season) => {
      const { count, error: countError } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('season_id', season.id);

      return {
        ...season,
        match_count: countError ? 0 : count || 0
      };
    })
  );

  return seasonsWithCounts;
}

async function fetchSeasonByIdFromDB(seasonId: string): Promise<Season | null> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', seasonId)
    .single();

  if (error) {
    console.error('Error fetching season:', error);
    throw error;
  }

  return data as Season;
}

async function fetchSeasonReviewFromDB(seasonId: string): Promise<SeasonReview | null> {
  try {
    
    // Query seasons table for season_review column
    const { data, error } = await supabase
      .from('seasons')
      .select('season_review')
      .eq('id', seasonId)
      .single();

    if (error) {
      console.warn('Season review fetch error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        seasonId
      });
      return null;
    }

    // If season_review exists and is not null/empty, return it
    if (data && data.season_review) {
      return {
        season_id: parseInt(seasonId),
        title: 'Season Review', // Default title
        content: data.season_review,
        highlights: []
      } as SeasonReview;
    }

    return null;
  } catch (err) {
    console.error('Unexpected error fetching season review:', err);
    return null;
  }
}

// Cached functions
export const getSeasons = createCachedFunction(
  fetchSeasonsFromDB,
  {
    keyParts: ['seasons', 'all'],
    tags: [CACHE_TAGS.SEASONS],
    revalidate: CACHE_TTL.STATIC_CONTENT,
  }
);

export const getSeasonsWithMatchCounts = createCachedFunction(
  fetchSeasonsWithMatchCountsFromDB,
  {
    keyParts: ['seasons', 'with-counts'],
    tags: [CACHE_TAGS.SEASONS],
    revalidate: CACHE_TTL.STATIC_CONTENT,
  }
);

export const getSeasonById = createCachedFunction(
  fetchSeasonByIdFromDB,
  {
    keyParts: ['season', 'by-id'],
    tags: [CACHE_TAGS.SEASONS],
    revalidate: CACHE_TTL.STATIC_CONTENT,
  }
);

export const getSeasonReview = createCachedFunction(
  fetchSeasonReviewFromDB,
  {
    keyParts: ['season', 'review'],
    tags: [CACHE_TAGS.SEASONS],
    revalidate: CACHE_TTL.STATIC_CONTENT,
  }
);

// Helper functions for specific use cases
export async function getSeasonsList() {
  return getSeasonsWithMatchCounts();
}

export async function getSeasonDetails(seasonId: string) {
  return getSeasonById(seasonId);
}

export async function getSeasonReviewDetails(seasonId: string) {
  return getSeasonReview(seasonId);
}

async function fetchAllSeasonStatsFromDB(): Promise<SeasonStatsData[]> {
  const seasons = await fetchSeasonsFromDB();
  
  const statsData = await Promise.all(
    seasons.map(async (season) => {
      const matches = await getSeasonMatches(season.id.toString());
      
      // Filter for league matches (WSL) with scores
      const leagueMatches = matches.filter(match => {
        const hasScore = match.spurs_score !== null && match.opponent_score !== null;
        const isWSL = match.competitions?.name?.toLowerCase().includes('super league');
        return hasScore && isWSL;
      });
      
      // Filter for cup matches (competitive but not WSL or friendly)
      const cupMatches = matches.filter(match => 
        match.spurs_score !== null && 
        match.opponent_score !== null &&
        match.competitions?.name &&
        !match.competitions.name.toLowerCase().includes('super league') &&
        !match.competitions.name.toLowerCase().includes('friendly')
      );
      
      const totalMatches = leagueMatches.length;
      const wins = leagueMatches.filter(match => match.spurs_score! > match.opponent_score!).length;
      const winPercentage = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
      
      const goalsScored = leagueMatches.reduce((sum, match) => sum + (match.spurs_score || 0), 0);
      const goalsConceded = leagueMatches.reduce((sum, match) => sum + (match.opponent_score || 0), 0);
      const goalsPerGame = totalMatches > 0 ? goalsScored / totalMatches : 0;
      const goalsConcededPerGame = totalMatches > 0 ? goalsConceded / totalMatches : 0;
      
      // Attendance calculation (all competitive matches)
      const allCompetitiveMatches = [...leagueMatches, ...cupMatches];
      const attendedMatches = allCompetitiveMatches.filter(match => match.attended).length;
      const attendancePercentage = allCompetitiveMatches.length > 0
        ? (attendedMatches / allCompetitiveMatches.length) * 100
        : 0;

      // Calculate match stats (league only)
      const matchesWithStats = leagueMatches.filter(match =>
        match.home_possession !== null || match.away_possession !== null
      );

      const possessionSum = matchesWithStats.reduce((sum, match) => {
        if (match.is_home_match) {
          return sum + (match.home_possession || 0);
        } else {
          return sum + (match.away_possession || 0);
        }
      }, 0);

      const totalShotsSum = matchesWithStats.reduce((sum, match) => {
        if (match.is_home_match) {
          return sum + (match.home_total_shots || 0);
        } else {
          return sum + (match.away_total_shots || 0);
        }
      }, 0);

      const shotsOnTargetSum = matchesWithStats.reduce((sum, match) => {
        if (match.is_home_match) {
          return sum + (match.home_shots_on_target || 0);
        } else {
          return sum + (match.away_shots_on_target || 0);
        }
      }, 0);

      const cornersSum = matchesWithStats.reduce((sum, match) => {
        if (match.is_home_match) {
          return sum + (match.home_corners || 0);
        } else {
          return sum + (match.away_corners || 0);
        }
      }, 0);

      const averagePossession = matchesWithStats.length > 0 ? possessionSum / matchesWithStats.length : 0;
      const averageTotalShots = matchesWithStats.length > 0 ? totalShotsSum / matchesWithStats.length : 0;
      const averageShotsOnTarget = matchesWithStats.length > 0 ? shotsOnTargetSum / matchesWithStats.length : 0;
      const averageCorners = matchesWithStats.length > 0 ? cornersSum / matchesWithStats.length : 0;

      return {
        seasonId: season.id,
        seasonName: season.name,
        winPercentage,
        goalsPerGame,
        goalsConcededPerGame,
        attendancePercentage,
        averagePossession,
        averageTotalShots,
        averageShotsOnTarget,
        averageCorners
      };
    })
  );

  return statsData;
}

export const getAllSeasonStats = createCachedFunction(
  fetchAllSeasonStatsFromDB,
  {
    keyParts: ['seasons', 'all-stats'],
    tags: [CACHE_TAGS.SEASONS],
    revalidate: CACHE_TTL.STATIC_CONTENT,
  }
);
