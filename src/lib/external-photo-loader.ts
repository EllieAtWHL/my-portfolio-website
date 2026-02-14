import { PhotoManifest, FolderKey } from '@/types/photo-manifest';

/**
 * External Repository Photo Loading System
 * 
 * Supports loading images from external GitHub repository via CDN
 */

/**
 * Simple inline Supabase loader
 */
async function loadPhotosFromSupabase(storagePath: string): Promise<string[]> {
  try {
    console.log('Loading photos from Supabase:', storagePath);
    
    // Remove "storage/" prefix if present
    const cleanPath = storagePath.replace(/^storage\//, '');
    console.log('Clean path for Supabase:', cleanPath);
    
    // Import Supabase dynamically to avoid circular dependency
    const { supabase } = await import('@/utils/supabase');
    
    const { data: files, error } = await supabase.storage
      .from('match-photos')
      .list(cleanPath);
    
    if (error) {
      console.error(`Error loading Supabase photos from ${cleanPath}:`, error);
      return [];
    }
    
    if (!files || files.length === 0) {
      console.log(`No photos found in Supabase path: ${cleanPath}`);
      return [];
    }
    
    console.log('Found files in Supabase:', files.map(f => f.name));
    
    const photoUrls = files
      .filter(file => file.name !== '.emptyFolderPlaceholder')
      .map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('match-photos')
          .getPublicUrl(`${cleanPath}/${file.name}`);
        return publicUrl;
      });
    
    console.log('Generated Supabase URLs:', photoUrls.length);
    return photoUrls;
  } catch (error) {
    console.error(`Error accessing Supabase storage for ${storagePath}:`, error);
    return [];
  }
}

/**
 * Loads photos from external repository manifest
 * @param folderKey - The folder key for the external repository
 * @param manifest - The photo manifest
 * @returns Array of image URLs (already CDN URLs)
 */
export function loadPhotosFromExternalRepo(folderKey: FolderKey, manifest: PhotoManifest): string[] {
  return manifest[folderKey] || [];
}

/**
 * Determines if a photo album uses external repository
 * @param photo - The photo media record
 * @returns Boolean indicating if external repository
 */
export function isExternalRepoPhoto(photo: any): boolean {
  return photo.storage_source === 'external' || 
         (photo.url && photo.url.startsWith('https://cdn.'));
}

/**
 * Hybrid photo loading function that supports both Supabase and external repository
 * @param photo - The photo media record
 * @param manifest - The photo manifest
 * @returns Promise resolving to array of image URLs
 */
export async function loadPhotosHybridWithExternal(
  photo: any, 
  manifest: PhotoManifest
): Promise<string[]> {
  // Use explicit storage_source field if available
  if (photo.storage_source) {
    console.log(`Loading photos from ${photo.storage_source}:`, photo.url);
    
    if (photo.storage_source === 'github') {
      return loadPhotosFromExternalRepo(photo.url, manifest);
    } else if (photo.storage_source === 'supabase') {
      return await loadPhotosFromSupabase(photo.url);
    } else if (photo.storage_source === 'external') {
      return loadPhotosFromExternalRepo(photo.url, manifest);
    }
  }
  
  // Fallback to URL-based detection for backward compatibility
  console.warn('No storage_source field, falling back to URL detection');
  
  if (photo.url && photo.url.startsWith('https://cdn.')) {
    return loadPhotosFromExternalRepo(photo.url, manifest);
  }
  
  return [];
}

/**
 * Migration helper to set external repository storage source
 * @param photos - Array of photo media records
 * @returns Array of SQL statements
 */
export function generateExternalRepoMigration(photos: any[]): string[] {
  const statements: string[] = [];
  
  photos.forEach(photo => {
    if (photo.type === 'photo album' && !photo.storage_source) {
      // Determine storage source based on URL pattern
      let storageSource = 'supabase'; // Default to supabase for existing records
      
      if (photo.url && photo.url.startsWith('https://cdn.')) {
        storageSource = 'external';
      } else if (photo.url && !photo.url.includes('storage') && !photo.url.includes('/')) {
        storageSource = 'github';
      }
      
      const sql = `-- Update storage source for album ${photo.id}
UPDATE media 
SET storage_source = '${storageSource}' 
WHERE id = ${photo.id} AND type = 'photo album';`;
      
      statements.push(sql);
    }
  });
  
  return statements;
}

/**
 * Validates external repository configuration
 * @returns Object with validation results
 */
export function validateExternalRepoConfig() {
  const requiredEnvVars = ['EXTERNAL_REPO_OWNER', 'EXTERNAL_REPO_NAME'];
  const optionalEnvVars = ['GITHUB_TOKEN', 'CDN_PROVIDER', 'CDN_BASE_URL'];
  
  const validation = {
    required: {} as Record<string, boolean>,
    optional: {} as Record<string, boolean>,
    hasToken: false,
    canUseApi: false
  };
  
  requiredEnvVars.forEach(envVar => {
    validation.required[envVar] = !!process.env[envVar];
  });
  
  optionalEnvVars.forEach(envVar => {
    validation.optional[envVar] = !!process.env[envVar];
  });
  
  validation.hasToken = !!process.env.GITHUB_TOKEN;
  validation.canUseApi = validation.hasToken && 
                        validation.required['EXTERNAL_REPO_OWNER'] && 
                        validation.required['EXTERNAL_REPO_NAME'];
  
  return validation;
}
