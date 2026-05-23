import { supabase } from '@/utils/supabase';
import { createCachedFunction, CACHE_TTL, CACHE_TAGS, CACHE_KEYS } from './cache-utils';

export interface Season {
  id: number;
  name: string;
}

export interface SeasonWithMatchCount extends Season {
  match_count?: number;
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
