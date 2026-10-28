import { Metadata } from 'next';
import { Card } from '@/components/Card';
import { getStadiumsWithMatchCounts, StadiumWithMatchCount, StadiumName, getAllStadiumNames, getCurrentStadiumName } from '@/lib/data/stadiums';
import Link from 'next/link';
import { generatePageMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(
    'Stadiums - Tottenham Hotspur Women',
    'Browse all stadiums where Tottenham Hotspur Women have played'
  );
}

export default async function StadiumsPage() {
  // Every stadium's name history comes from one query; if it fails, stadiums
  // just show their stadia name rather than taking the whole page down.
  const [stadiums, namesByStadium] = await Promise.all([
    getStadiumsWithMatchCounts().catch((error): StadiumWithMatchCount[] => {
      console.error('Error fetching stadiums:', error);
      return [];
    }),
    getAllStadiumNames().catch((error): Record<string, StadiumName[]> => {
      console.error('Error fetching stadium names:', error);
      return {};
    }),
  ]);

  const stadiumsWithCurrentNames = stadiums.map((stadium) => ({
    ...stadium,
    currentName: getCurrentStadiumName(namesByStadium[stadium.id] ?? []) || stadium.name
  }));

  // Sort alphabetically by current name
  stadiumsWithCurrentNames.sort((a, b) => a.currentName.localeCompare(b.currentName));

  return (
    <main id="main-content" className="p-8 pb-footer-clearance">
      <h1 className="spurs-text font-bold mb-2 text-center">Stadiums</h1>
      <p className="spurs-text text-center text-sm mb-6">
        Know your grounds?{' '}
        <Link href="/spurs-women/groundhopper" className="spurs-text underline underline-offset-2 hover:opacity-80">
          Play Groundhopper
        </Link>
        , the daily map game.
      </p>

      {stadiumsWithCurrentNames.length === 0 ? (
        <Card variant="spursAccent">
          <p className="text-center spurs-text">
            No stadium information available at the moment.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stadiumsWithCurrentNames.map((stadium) => (
            <Link 
              key={stadium.slug} 
              href={`/spurs-women/stadiums/${stadium.slug}`}
              className="block h-full"
            >
              <Card variant="spursAccent" hover={true} clickable={true} className="h-full">
                <div className="flex justify-between items-start mb-1">
                  <div className="spurs-text text-base font-semibold">{stadium.currentName}</div>
                  <p className="text-xs">
                    {stadium.match_count === 0 ? 'No matches' : `${stadium.match_count} match${stadium.match_count === 1 ? '' : 'es'}`}
                  </p>
                </div>
                {stadium.city && stadium.country && (
                  <p className="spurs-text text-xs opacity-75">
                    {stadium.city}, {stadium.country}
                  </p>
                )}
                {stadium.capacity && (
                  <p className="spurs-text text-xs opacity-75">
                    Capacity: {stadium.capacity.toLocaleString()}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
