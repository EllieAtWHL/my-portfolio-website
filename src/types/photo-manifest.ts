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

export type FolderKey = string;

export interface PhotoAlbumMedia {
  id: number | string;
  type: 'photo album';
  url: FolderKey;
  caption: string | null;
  title?: string | null;
}
