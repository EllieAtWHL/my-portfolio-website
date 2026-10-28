'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/spurs-women/Skeleton';
import type { GroundhopperStadium } from '@/lib/groundhopper';

// Client-only: the game needs the visitor's date and localStorage from its
// first render, and Leaflet touches `window` as soon as it's imported. Loading
// it here (rather than in the server page) is what keeps both out of SSR.
const GroundhopperGame = dynamic(() => import('./GroundhopperGame'), {
  ssr: false,
  loading: () => (
    <div className="groundhopper-layout" aria-busy="true" aria-label="Loading Groundhopper">
      <Skeleton className="groundhopper-panel groundhopper-skeleton h-56" />
      <Skeleton className="groundhopper-map-frame groundhopper-skeleton" />
    </div>
  ),
});

export default function GroundhopperLoader({ stadiums }: { stadiums: GroundhopperStadium[] }) {
  return <GroundhopperGame stadiums={stadiums} />;
}
