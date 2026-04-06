import { supabase } from '@/utils/supabase';
import { createCachedFunction, CACHE_TAGS, CACHE_TTL } from './cache-utils';

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
  const { data, error } = await supabase
    .from('stadia')
    .select('*')
    .order('name');

  if (error) {
    throw error;
  }

  return data as Stadium[];
}

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
  
  // Note: Cache invalidation should be handled via API routes or server actions
  // Log the cache keys that would be invalidated
  cacheKeys.forEach(key => {
    console.log(`Cache invalidation requested: ${key}`);
  });
}

export async function invalidateAllStadiumCaches() {
  const cacheKeys = [
    'stadiums',
    'stadium-names'
  ];
  
  // Note: Cache invalidation should be handled via API routes or server actions
  // Log the cache keys that would be invalidated
  cacheKeys.forEach(key => {
    console.log(`Cache invalidation requested: ${key}`);
  });
}
