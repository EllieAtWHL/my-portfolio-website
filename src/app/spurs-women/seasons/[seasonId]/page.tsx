import { notFound } from 'next/navigation';
import SeasonFilterClient from './SeasonFilterClient';
import { getMatchesBySeason, getSeasonDetails } from '@/lib/data';

interface SeasonDetailPageProps {
  params: {
    seasonId: string;
  };
}

export async function generateMetadata({ params }: SeasonDetailPageProps) {
  const seasonId = (await params).seasonId;
  const season = await getSeasonDetails(seasonId);
  
  return {
    title: season ? `${season.name} - Tottenham Hotspur Women` : 'Season Details - Tottenham Hotspur Women',
  };
}

export default async function SeasonDetailPage({ params }: SeasonDetailPageProps) {
  const seasonId = (await params).seasonId;

  if (!seasonId) {
    notFound();
  }

  // Fetch season name and matches in parallel with caching
  const [season, matches] = await Promise.all([
    getSeasonDetails(seasonId),
    getMatchesBySeason(seasonId)
  ]);

  if (!season) {
    notFound();
  }

  return <SeasonFilterClient matches={matches} seasonName={season.name} />;
}
