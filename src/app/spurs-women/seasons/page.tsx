import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { getSeasonsWithMatchCounts } from '@/lib/data/seasons';
import { SeasonWithMatchCount } from '@/lib/data/seasons';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Seasons - Tottenham Hotspur Women',
    description: 'Browse all seasons of Tottenham Hotspur Women matches and statistics',
  };
}

export default async function SeasonsPage() {
  // Fetch seasons server-side with caching
  const seasons = await getSeasonsWithMatchCounts();

  return (
    <main className="p-8">
      <h1 className="spurs-text text-3xl font-bold mb-6">Seasons</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {seasons.map((season: SeasonWithMatchCount) => (
          <Link
            key={season.id}
            href={`/spurs-women/seasons/${season.id}`}
            className="block"
          >
            <Card variant="spursAccent" hover={true}>
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold">{season.name}</h2>
                <p className="text-sm">
                  {season.match_count === 0 ? 'No matches' : `${season.match_count} match${season.match_count === 1 ? '' : 'es'}`}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
