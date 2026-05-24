import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStadiumBySlug } from '@/lib/data/stadiums';
import StadiumClient from './StadiumClient';

interface PageProps {
  params: Promise<{
    stadiumSlug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { stadiumSlug } = await params;
  const stadium = await getStadiumBySlug(stadiumSlug);
  
  if (!stadium) {
    return {
      title: 'Stadium Not Found - Tottenham Hotspur Women',
    };
  }

  return {
    title: `${stadium.name} - Tottenham Hotspur Women`,
    description: `Matches and details for ${stadium.name} - Tottenham Hotspur Women`,
  };
}

export default async function StadiumPage({ params }: PageProps) {
  const { stadiumSlug } = await params;
  const stadium = await getStadiumBySlug(stadiumSlug);

  if (!stadium) {
    notFound();
  }

  return <StadiumClient stadium={stadium} stadiumSlug={stadiumSlug} />;
}
