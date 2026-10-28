import { Metadata } from 'next';
import { getGroundhopperStadiums, getStadiumNames, getCurrentStadiumName } from '@/lib/data/stadiums';
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
    const allStadiums = await getGroundhopperStadiums();
    const playable = await Promise.all(
      allStadiums.map(async stadium => {
        // The current name is a nice-to-have on the reveal - one failed
        // lookup shouldn't take the whole game down with it. Only Spurs Women
        // grounds have stadium_names history; imported ones are skipped
        // rather than costing a query each.
        const names = stadium.spurs_women ? await getStadiumNames(stadium.id).catch(() => []) : [];
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
        Five grounds a day, one of them a Spurs Women ground. Find each one on the map - the closer you tap, the more you score.
      </p>
      <GroundhopperLoader stadiums={stadiums} />
    </main>
  );
}
