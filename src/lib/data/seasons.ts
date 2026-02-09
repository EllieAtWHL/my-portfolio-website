import { supabase } from '@/utils/supabase';
import { createCachedFunction, CACHE_TTL, CACHE_TAGS, CACHE_KEYS } from './cache-utils';

export interface Season {
  id: number;
  name: string;
}

export interface SeasonWithMatchCount extends Season {
  match_count?: number;
}

// Raw database fetch functions
async function fetchSeasonsFromDB(): Promise<Season[]> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('id', { ascending: false });

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
    .order('id', { ascending: false });

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

// Helper functions for specific use cases
export async function getSeasonsList() {
  return getSeasonsWithMatchCounts();
}

export async function getSeasonDetails(seasonId: string) {
  return getSeasonById(seasonId);
}
