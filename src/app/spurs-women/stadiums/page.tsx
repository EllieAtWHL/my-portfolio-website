import { Metadata } from 'next';
import { Card } from '@/components/Card';
import { getStadiumsWithMatchCounts, StadiumWithMatchCount, getStadiumNames, getCurrentStadiumName } from '@/lib/data/stadiums';
import Link from 'next/link';
import { generatePageMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(
    'Stadiums - Tottenham Hotspur Women',
    'Browse all stadiums where Tottenham Hotspur Women have played'
  );
}

export default async function StadiumsPage() {
  let stadiums: StadiumWithMatchCount[] = [];
  
  try {
    stadiums = await getStadiumsWithMatchCounts();
  } catch (error) {
    console.error('Error fetching stadiums:', error);
  }

  // Fetch stadium names for each stadium to get current names
  const stadiumsWithCurrentNames = await Promise.all(
    stadiums.map(async (stadium) => {
      const stadiumNames = await getStadiumNames(stadium.id);
      const currentName = getCurrentStadiumName(stadiumNames);
      return {
        ...stadium,
        currentName: currentName || stadium.name
      };
    })
  );

  // Sort alphabetically by current name
  stadiumsWithCurrentNames.sort((a, b) => a.currentName.localeCompare(b.currentName));

  return (
    <main className="p-8">
      <h1 className="spurs-text text-2xl font-bold mb-6">Stadiums</h1>
      
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
