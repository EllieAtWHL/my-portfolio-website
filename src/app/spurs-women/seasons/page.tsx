import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { getSeasonsWithMatchCounts, getAllSeasonStats } from '@/lib/data/seasons';
import { SeasonWithMatchCount } from '@/lib/data/seasons';
import SeasonStatsChart from '@/components/spurs-women/SeasonStatsChart';
import { generatePageMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(
    'Seasons - Tottenham Hotspur Women',
    'Browse all seasons of Tottenham Hotspur Women matches and statistics'
  );
}

export default async function SeasonsPage() {
  // Fetch seasons server-side with caching
  const seasons = await getSeasonsWithMatchCounts();
  const seasonStats = await getAllSeasonStats();

  return (
    <main className="p-8 pb-footer-clearance">
      <h1 className="spurs-text font-bold mb-6 text-center">Seasons</h1>
      
      {/* Season Stats Chart - Desktop only */}
      <div className="hidden md:block mb-8">
        <SeasonStatsChart stats={seasonStats} />
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {seasons.map((season: SeasonWithMatchCount) => (
          <Link
            key={season.id}
            href={`/spurs-women/seasons/${season.id}`}
            className="block"
          >
            <Card variant="spursAccent" hover={true} clickable={true}>
              <div className="flex justify-between items-start">
                <div className="spurs-text text-base font-semibold">{season.name}</div>
                <p className="text-xs">
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
