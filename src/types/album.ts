export type Album = {
  id: string;
  match_id: string;
  bucket: string;
  path: string;
  title?: string;
  created_at: string;
};

export type AlbumPhoto = {
  name: string;
  url: string;
};
