import { supabase } from '@/utils/supabase';
import { createCachedFunction, CACHE_TAGS, CACHE_TTL } from './cache-utils';
import { fetchAllFromDB, fetchWithSingleMatchCountFromDB } from './generic-fetchers';

export interface Team {
  id: number;
  name: string;
  short_name: string;
  primary_color: string | null;
  secondary_color: string | null;
  is_tottenham: boolean;
}

export interface Stadium {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  capacity: number | null;
  opened_date: string | null;
  address_line_1: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  home_team_id: number | null;
  home_team?: {
    id: number;
    name: string;
    short_name: string;
    primary_color: string | null;
    secondary_color: string | null;
    is_tottenham: boolean;
  } | null;
}

export interface StadiumWithMatchCount extends Stadium {
  match_count?: number;
}

export interface StadiumName {
  id: string;
  stadium_id: string;
  name: string;
  valid_from: string | null;
  valid_to: string | null;
}

// Raw database fetch functions
async function fetchStadiumBySlugFromDB(slug: string): Promise<Stadium | null> {
  const { data, error } = await supabase
    .from('stadia')
    .select(`
      *,
      home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching stadium:', error.message || JSON.stringify(error));
    return null;
  }

  return data as Stadium;
}

async function fetchStadiumNamesFromDB(stadiumId: string): Promise<StadiumName[]> {
  const { data, error } = await supabase
    .from('stadium_names')
    .select('*')
    .eq('stadium_id', stadiumId)
    .order('valid_from', { ascending: false });

  if (error) {
    throw error;
  }

  return data as StadiumName[];
}

async function fetchAllStadiumsFromDB(): Promise<Stadium[]> {
  return fetchAllFromDB<Stadium>('stadia', 'name');
}

async function fetchStadiumsWithMatchCountsFromDB(): Promise<StadiumWithMatchCount[]> {
  return fetchWithSingleMatchCountFromDB<Stadium>('stadia', 'matches', 'stadium_id', 'name');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchMatchesAtStadiumFromDB(stadiumSlug: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('matches_with_stadium')
    .select(`
      *,
      home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
      away_team:away_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
      competitions:competition_id(name, icon_svg)
    `)
    .eq('stadium_slug', stadiumSlug)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching matches at stadium:', error.message || JSON.stringify(error));
    return [];
  }

  return data || [];
}

// Cached functions for stadium data
export const getStadiumBySlug = createCachedFunction(
  fetchStadiumBySlugFromDB,
  {
    keyParts: ['stadium', 'by-slug'],
    tags: [CACHE_TAGS.STADIUMS],
    revalidate: CACHE_TTL.STADIUM_DATA,
  }
);

export const getAllStadiums = createCachedFunction(
  fetchAllStadiumsFromDB,
  {
    keyParts: ['stadiums', 'all'],
    tags: [CACHE_TAGS.STADIUMS],
    revalidate: CACHE_TTL.STADIUM_DATA,
  }
);

export const getStadiumsWithMatchCounts = createCachedFunction(
  fetchStadiumsWithMatchCountsFromDB,
  {
    keyParts: ['stadiums', 'with-counts'],
    tags: [CACHE_TAGS.STADIUMS],
    revalidate: CACHE_TTL.STADIUM_DATA,
  }
);

export const getStadiumNames = createCachedFunction(
  fetchStadiumNamesFromDB,
  {
    keyParts: ['stadium-names', 'by-stadium-id'],
    tags: [CACHE_TAGS.STADIUM_NAMES],
    revalidate: CACHE_TTL.STADIUM_DATA,
  }
);

export const getMatchesAtStadium = createCachedFunction(
  fetchMatchesAtStadiumFromDB,
  {
    keyParts: ['matches', 'at-stadium'],
    tags: [CACHE_TAGS.MATCHES],
    revalidate: CACHE_TTL.CURRENT_SEASON_MATCHES,
  }
);

export async function invalidateStadiumCache(stadiumId?: string, stadiumSlug?: string) {
  const cacheKeys = [];
  
  if (stadiumId) {
    cacheKeys.push(`stadium:by-id:${stadiumId}`);
  }
  
  if (stadiumSlug) {
    cacheKeys.push(`stadium:by-slug:${stadiumSlug}`);
  }
  
  cacheKeys.push('stadiums');
  
  cacheKeys.push('stadium-names');

}

export async function invalidateAllStadiumCaches() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cacheKeys = [
    'stadiums',
    'stadium-names'
  ];

}

export function getCurrentStadiumName(stadiumNames: StadiumName[], date?: Date): string | null {
  if (!stadiumNames || stadiumNames.length === 0) {
    return null;
  }

  const targetDate = date || new Date();

  // Find a name that's valid for the target date
  const validName = stadiumNames.find(name => {
    const validFrom = name.valid_from ? new Date(name.valid_from) : null;
    const validTo = name.valid_to ? new Date(name.valid_to) : null;

    if (validFrom && targetDate < validFrom) {
      return false;
    }
    if (validTo && targetDate > validTo) {
      return false;
    }
    return true;
  });

  if (validName) {
    return validName.name;
  }

  // If no currently valid name, return the most recent one (the first one since they're ordered by valid_from desc)
  return stadiumNames[0].name;
}
