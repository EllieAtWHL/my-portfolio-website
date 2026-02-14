import { supabase } from '@/utils/supabase';
import { createCachedFunction, CACHE_TTL, CACHE_TAGS } from './cache-utils';

export interface Media {
  id: number | string;
  match_id: number;
  type: 'photo' | 'photo album' | 'article' | 'social media' | 'video-external';
  title: string | null;
  url: string;
  storage_source?: 'supabase' | 'github' | null; // NEW: Explicit storage source
  thumbnail_url: string | null;
  description: string | null;
  source: string | null;
  date: string | null;
  sort_order: number;
  created_at: string;
  caption: string | null;
}

export interface PhotoMedia extends Media {
  url: string;
  caption: string | null;
  type: 'photo' | 'photo album';
  storage_source?: 'supabase' | 'github' | null; // Include storage_source in PhotoMedia too
}

// Raw database fetch functions
async function fetchMediaByMatchFromDB(matchId: string): Promise<Media[]> {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('match_id', matchId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching media:', error);
    return [];
  }

  return data as Media[];
}

// Cached function for media
export const getMediaByMatch = createCachedFunction(
  fetchMediaByMatchFromDB,
  {
    keyParts: ['media', 'match'],
    tags: [CACHE_TAGS.MEDIA],
    revalidate: CACHE_TTL.MEDIA, // 6 hours for media
  }
);

// Helper functions to filter media by type
export function getPhotosByMatch(matchId: string): Promise<PhotoMedia[]> {
  return getMediaByMatch(matchId).then(media => 
    media.filter((m): m is PhotoMedia => m.type === 'photo' || m.type === 'photo album')
  );
}

export function getArticlesByMatch(matchId: string): Promise<Media[]> {
  return getMediaByMatch(matchId).then(media => 
    media.filter(m => m.type === 'article')
  );
}

export function getSocialMediaByMatch(matchId: string): Promise<Media[]> {
  return getMediaByMatch(matchId).then(media => 
    media.filter(m => m.type === 'social media')
  );
}

export function getVideosByMatch(matchId: string): Promise<Media[]> {
  return getMediaByMatch(matchId).then(media => 
    media.filter(m => m.type === 'video-external')
  );
}
