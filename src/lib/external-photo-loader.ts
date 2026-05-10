import { PhotoManifest, FolderKey } from '@/types/photo-manifest';
import { Media } from '@/lib/data/media';

/**
 * External Repository Photo Loading System
 * 
 * Loads images from external GitHub repository via CDN
 */

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
 * Loads photos from GitHub repository
 * @param photo - The photo media record
 * @param manifest - The photo manifest
 * @returns Array of image URLs
 */
export function loadPhotosFromGitHub(
  photo: Media, 
  manifest: PhotoManifest
): string[] {
  return loadPhotosFromExternalRepo(photo.url, manifest);
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
