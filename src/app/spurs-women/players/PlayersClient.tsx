'use client';

import { ErrorState } from '@/components/ErrorState';
import PlayerTable from '@/components/spurs-women/PlayerTable';
import { useRetryableAsync } from '@/hooks/useRetryableAsync';
import { getAllPlayers } from '@/lib/data/players';
import type { PlayerWithStats } from '@/lib/data/teams';

export default function PlayersClient() {
  const { data: players, loading, hasError, retry } = useRetryableAsync<PlayerWithStats[]>(
    () => getAllPlayers(),
    [],
    [],
    'Error loading players:'
  );

  if (loading) {
    return (
      <main id="main-content" className="p-8 pb-footer-clearance">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <p className="spurs-text text-lg">Loading players...</p>
          </div>
        </div>
      </main>
    );
  }

  if (hasError) {
    return (
      <main id="main-content" className="p-8 pb-footer-clearance">
        <div className="max-w-6xl mx-auto">
          <h1 className="spurs-text font-bold mb-8 text-center">Tottenham Hotspur Women Players</h1>
          <ErrorState
            message="Couldn't load players. Please try again."
            onRetry={retry}
            cardVariant="spursAccent"
            buttonVariant="spurs"
          />
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="p-8 pb-footer-clearance">
      <div className="max-w-6xl mx-auto">
        <h1 className="spurs-text font-bold mb-8 text-center">Tottenham Hotspur Women Players</h1>
        <PlayerTable players={players} constrainHeight={false} showCurrentClub />
      </div>
    </main>
  );
}
