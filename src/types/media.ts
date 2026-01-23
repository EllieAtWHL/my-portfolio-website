export type Media = {
  id: number | string;
  type: 'photo' | 'article' | 'social media' | 'photo album' | 'video-external';
  url: string;
  caption: string | null;
  title?: string | null;
};

export type PhotoMedia = {
  id: number | string;
  url: string;
  caption?: string | null;
  type?: 'photo' | 'photo album';
};
