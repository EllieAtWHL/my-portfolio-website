import { Metadata } from 'next';
import { getGroundhopperStadiums, getAllStadiumNames, getCurrentStadiumName, type StadiumName } from '@/lib/data/stadiums';
import { toGroundhopperStadium, type GroundhopperStadium } from '@/lib/groundhopper';
import { generatePageMetadata } from '@/lib/metadata';
import GroundhopperLoader from '@/components/spurs-women/groundhopper/GroundhopperLoader';
import '@/styles/groundhopper-layer.css';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(
    'Groundhopper - Tottenham Hotspur Women',
    'A daily map game: find five football grounds from around England and Scotland, including one Tottenham Hotspur Women ground. The closer you tap, the more you score.'
  );
}

export default async function GroundhopperPage() {
  let stadiums: GroundhopperStadium[] = [];

  try {
    // The current name is a nice-to-have on the reveal - a failed names
    // lookup shouldn't take the whole game down with it.
    const [allStadiums, namesByStadium] = await Promise.all([
      getGroundhopperStadiums(),
      getAllStadiumNames().catch((): Record<string, StadiumName[]> => ({})),
    ]);
    stadiums = allStadiums
      .map(stadium => toGroundhopperStadium(stadium, getCurrentStadiumName(namesByStadium[stadium.id] ?? [])))
      .filter((s): s is GroundhopperStadium => s !== null);
  } catch (error) {
    console.error('Error fetching stadiums for Groundhopper:', error);
  }

  return (
    <main id="main-content" className="p-4 sm:p-8 pb-footer-clearance">
      <h1 className="spurs-text font-bold mb-2 text-center">Groundhopper</h1>
      <p className="spurs-text text-center text-sm opacity-75 mb-6">
        Five grounds a day, one of them a Spurs Women ground. Find each one on the map - the closer you tap, the more you score.
      </p>
      <GroundhopperLoader stadiums={stadiums} />
    </main>
  );
}
