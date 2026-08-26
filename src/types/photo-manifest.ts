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
