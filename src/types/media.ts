export type Media = {
  id: number;
  type: 'photo' | 'article' | 'social media' | 'photo album';
  url: string;
  caption: string | null;
};

export type PhotoMedia = {
  id: number | string;
  url: string;
  caption?: string | null;
  type?: 'photo' | 'photo album';
};
