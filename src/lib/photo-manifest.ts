import { PhotoManifest } from '@/types/photo-manifest';

/**
 * Fetches the photo manifest from the external GitHub repository
 * This manifest contains mappings of folder keys to CDN URLs
 */
export async function fetchPhotoManifest(): Promise<PhotoManifest> {
  try {
    const response = await fetch('/spurs-women/photo-gallery.manifest.json');
    
    if (!response.ok) {
      console.warn('Photo manifest not found, falling back to empty manifest');
      return {};
    }
    
    const manifest = await response.json();
    console.log('Loaded photo manifest with', Object.keys(manifest).length, 'folders');
    return manifest;
  } catch (error) {
    console.error('Error fetching photo manifest:', error);
    return {};
  }
}

/**
 * Checks if the photo manifest is available
 */
export async function isPhotoManifestAvailable(): Promise<boolean> {
  try {
    const response = await fetch('/spurs-women/photo-gallery.manifest.json', { 
      method: 'HEAD' 
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Gets the CDN URLs for a specific folder key
 */
export async function getFolderPhotos(folderKey: string): Promise<string[]> {
  const manifest = await fetchPhotoManifest();
  return manifest[folderKey] || [];
}
