import type { Metadata } from 'next';
import HomeHero from '@/components/HomeHero';
import { SITE_DESCRIPTION, SITE_TITLE, buildHomeStructuredData } from '@/lib/site';

export const metadata: Metadata = {
  // absolute: the root layout's template would otherwise turn this into
  // "Ellie Matthewman | ... | Ellie Matthewman".
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: '/',
    type: 'profile',
    images: ['/img/EllieMatthewman(Square).jpg'],
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/img/EllieMatthewman(Square).jpg'],
  },
};

export default function Home() {
  // `<` is escaped so profile/description text can never close the script tag.
  const structuredData = JSON.stringify(buildHomeStructuredData()).replace(/</g, '\\u003c');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      <HomeHero />
    </>
  );
}
