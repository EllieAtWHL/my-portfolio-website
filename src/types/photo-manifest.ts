/**
 * Photo Gallery Manifest Types
 * 
 * Types for the GitHub-based static image hosting system.
 * This replaces Supabase Storage with a manifest-based approach.
 */

export interface PhotoManifest {
  [folderKey: string]: string[];
}

export interface PhotoManifestResponse {
  manifest: PhotoManifest;
  lastUpdated: string;
}

export interface PhotoGalleryItem {
  id: string;
  url: string;
  caption?: string | null;
  type: 'photo';
}

/**
 * Folder key represents a logical identifier for a photo gallery
 * Examples: "2024-01-28-chelsea", "2024-02-11-arsenal"
 */
export type FolderKey = string;

/**
 * Photo album media record from Supabase
 * The `url` field now stores the folder key instead of a storage path
 */
export interface PhotoAlbumMedia {
  id: number | string;
  type: 'photo album';
  url: FolderKey; // This is now the folder key, not a storage path
  caption: string | null;
  title?: string | null;
}
