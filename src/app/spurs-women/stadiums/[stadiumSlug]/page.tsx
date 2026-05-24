import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStadiumBySlug } from '@/lib/data/stadiums';
import StadiumClient from './StadiumClient';
import { generatePageMetadata } from '@/lib/metadata';

interface PageProps {
  params: Promise<{
    stadiumSlug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { stadiumSlug } = await params;
  const stadium = await getStadiumBySlug(stadiumSlug);
  
  if (!stadium) {
    return generatePageMetadata(
      'Stadium Not Found - Tottenham Hotspur Women',
      'The requested stadium could not be found'
    );
  }

  return generatePageMetadata(
    `${stadium.name} - Tottenham Hotspur Women`,
    `Matches and details for ${stadium.name} - Tottenham Hotspur Women`
  );
}

export default async function StadiumPage({ params }: PageProps) {
  const { stadiumSlug } = await params;
  const stadium = await getStadiumBySlug(stadiumSlug);

  if (!stadium) {
    notFound();
  }

  return <StadiumClient stadium={stadium} stadiumSlug={stadiumSlug} />;
}
