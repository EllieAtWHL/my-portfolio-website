import { Card } from '@/components/Card';
import { getAllStadiums, Stadium } from '@/lib/data/stadiums';
import Link from 'next/link';

export default async function StadiumsPage() {
  let stadiums: Stadium[] = [];
  
  try {
    stadiums = await getAllStadiums();
  } catch (error) {
    console.error('Error fetching stadiums:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="spurs-text text-3xl font-bold mb-8 text-center">Stadiums</h1>
      
      {stadiums.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-gray-600">
            No stadium information available at the moment.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stadiums.map((stadium: Stadium) => (
            <Link 
              key={stadium.slug} 
              href={`/spurs-women/stadiums/${stadium.slug}`}
              className="block"
            >
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <h2 className="text-xl font-semibold mb-2">{stadium.name}</h2>
                {stadium.city && stadium.country && (
                  <p className="text-gray-600">
                    {stadium.city}, {stadium.country}
                  </p>
                )}
                {stadium.capacity && (
                  <p className="text-gray-600">
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
