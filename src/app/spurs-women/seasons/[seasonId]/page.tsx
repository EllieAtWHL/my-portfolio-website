import { notFound } from 'next/navigation';
import SeasonFilterClient from './SeasonFilterClient';
import { getMatchesBySeason, getSeasonDetails, getSeasonReviewDetails } from '@/lib/data';
import { generatePageMetadata } from '@/lib/metadata';

interface SeasonDetailPageProps {
  params: {
    seasonId: string;
  };
}

export async function generateMetadata({ params }: SeasonDetailPageProps) {
  const seasonId = (await params).seasonId;
  const season = await getSeasonDetails(seasonId);
  
  return generatePageMetadata(
    season ? `${season.name} - Tottenham Hotspur Women` : 'Season Details - Tottenham Hotspur Women',
    season ? `View matches and statistics for ${season.name}` : 'Season details for Tottenham Hotspur Women'
  );
}

export default async function SeasonDetailPage({ params }: SeasonDetailPageProps) {
  const seasonId = (await params).seasonId;

  if (!seasonId) {
    notFound();
  }

  // Fetch season name, matches, and review in parallel with caching
  const [season, matches, seasonReview] = await Promise.all([
    getSeasonDetails(seasonId),
    getMatchesBySeason(seasonId),
    getSeasonReviewDetails(seasonId)
  ]);

  if (!season) {
    notFound();
  }

  return (
    <SeasonFilterClient 
      matches={matches} 
      seasonName={season.name} 
      seasonReview={seasonReview}
    />
  );
}
