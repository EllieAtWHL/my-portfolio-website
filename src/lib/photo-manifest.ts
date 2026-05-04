import { PhotoManifest } from '@/types/photo-manifest';

export async function fetchPhotoManifest(): Promise<PhotoManifest> {
  try {
    const response = await fetch('/spurs-women/photo-gallery.manifest.json');
    
    if (!response.ok) {
      console.warn('Photo manifest not found, falling back to empty manifest');
      return {};
    }
    
    const manifest = await response.json();
    return manifest;
  } catch (error) {
    console.error('Error fetching photo manifest:', error);
    return {};
  }
}

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

export async function getFolderPhotos(folderKey: string): Promise<string[]> {
  const manifest = await fetchPhotoManifest();
  return manifest[folderKey] || [];
}
