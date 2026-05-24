import { Card } from '@/components/Card';
import { getStadiumsWithMatchCounts, StadiumWithMatchCount, getStadiumNames, getCurrentStadiumName } from '@/lib/data/stadiums';
import Link from 'next/link';

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="spurs-text text-3xl font-bold mb-8 text-center">Stadiums</h1>
      
      {stadiumsWithCurrentNames.length === 0 ? (
        <Card variant="spursAccent" padding="md">
          <p className="text-center spurs-text">
            No stadium information available at the moment.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stadiumsWithCurrentNames.map((stadium) => (
            <Link 
              key={stadium.slug} 
              href={`/spurs-women/stadiums/${stadium.slug}`}
              className="block spurs-text"
            >
              <Card variant="spursAccent" padding="md" clickable={true}>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">{stadium.currentName}</h2>
                  <p className="text-sm spurs-text opacity-75">
                    {stadium.match_count === 0 ? 'No matches' : `${stadium.match_count} match${stadium.match_count === 1 ? '' : 'es'}`}
                  </p>
                </div>
                {stadium.city && stadium.country && (
                  <p className="spurs-text opacity-75">
                    {stadium.city}, {stadium.country}
                  </p>
                )}
                {stadium.capacity && (
                  <p className="spurs-text opacity-75">
                    Capacity: {stadium.capacity.toLocaleString()}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
