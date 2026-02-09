import { notFound } from 'next/navigation';
import MatchCard from '@/components/spurs-women/MatchCard';
import { getMatchesBySeason, getSeasonDetails } from '@/lib/data';
import { Match, Season } from '@/lib/data';

interface SeasonDetailPageProps {
  params: {
    seasonId: string;
  };
}

export async function generateMetadata({ params }: SeasonDetailPageProps) {
  const seasonId = parseInt((await params).seasonId);
  const season = await getSeasonDetails(seasonId);
  
  return {
    title: season ? `${season.name} - Tottenham Hotspur Women` : 'Season Details - Tottenham Hotspur Women',
  };
}

export default async function SeasonDetailPage({ params }: SeasonDetailPageProps) {
  const seasonId = parseInt((await params).seasonId);

  if (isNaN(seasonId)) {
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

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="spurs-text text-3xl font-bold mb-6">
          Matches for {season.name}
        </h1>

        {matches.length === 0 ? (
          <p className="text-gray-500 italic">No matches found for this season.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
