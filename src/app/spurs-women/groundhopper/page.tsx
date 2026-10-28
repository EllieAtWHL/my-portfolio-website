import { Metadata } from 'next';
import { getAllStadiums, getStadiumNames, getCurrentStadiumName } from '@/lib/data/stadiums';
import { toGroundhopperStadium, type GroundhopperStadium } from '@/lib/groundhopper';
import { generatePageMetadata } from '@/lib/metadata';
import GroundhopperLoader from '@/components/spurs-women/groundhopper/GroundhopperLoader';
import '@/styles/groundhopper-layer.css';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(
    'Groundhopper - Tottenham Hotspur Women',
    'A daily map game: find five grounds Tottenham Hotspur Women have played at. The closer you tap, the more you score.'
  );
}

export default async function GroundhopperPage() {
  let stadiums: GroundhopperStadium[] = [];

  try {
    const allStadiums = await getAllStadiums();
    const playable = await Promise.all(
      allStadiums.map(async stadium => {
        const names = await getStadiumNames(stadium.id);
        return toGroundhopperStadium(stadium, getCurrentStadiumName(names));
      })
    );
    stadiums = playable.filter((s): s is GroundhopperStadium => s !== null);
  } catch (error) {
    console.error('Error fetching stadiums for Groundhopper:', error);
  }

  return (
    <main id="main-content" className="p-4 sm:p-8 pb-footer-clearance">
      <h1 className="spurs-text font-bold mb-2 text-center">Groundhopper</h1>
      <p className="spurs-text text-center text-sm opacity-75 mb-6">
        Five grounds Spurs Women have played at, every day. Find each one on the map - the closer you tap, the more you score.
      </p>
      <GroundhopperLoader stadiums={stadiums} />
    </main>
  );
}
