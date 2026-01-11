import { supabase } from '@utils/supabase';
import { AlbumPhoto } from '../types/album';

export async function getAlbumPhotos(bucket: string, path: string): Promise<AlbumPhoto[]> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (error) throw error;

  return data
    .filter(file => file.name !== '.emptyFolderPlaceholder')
    .map(file => ({
      name: file.name,
      url: supabase.storage
        .from(bucket)
        .getPublicUrl(`${path}/${file.name}`).data.publicUrl,
    }));
}
