'use client';

import { useCallback } from 'react';
import { ErrorState } from '@/components/ErrorState';
import PlayerTable from '@/components/spurs-women/PlayerTable';
import { useRetryableAsync } from '@/hooks/useRetryableAsync';
import { useSearchPagination } from '@/hooks/useSearchPagination';
import { getAllPlayers } from '@/lib/data/players';
import type { PlayerWithStats } from '@/lib/data/teams';

export default function PlayersClient() {
  const { data: players, loading, hasError, retry } = useRetryableAsync<PlayerWithStats[]>(
    () => getAllPlayers(),
    [],
    [],
    'Error loading players:'
  );

  const playerFilterFn = useCallback((player: PlayerWithStats, search: string) => {
    const searchTerm = search.toLowerCase();
    return (
      player.first_name?.toLowerCase().includes(searchTerm) ||
      player.last_name?.toLowerCase().includes(searchTerm) ||
      player.position?.toLowerCase().includes(searchTerm) ||
      player.nationality?.toLowerCase().includes(searchTerm)
    );
  }, []);
  // No perPage: the whole point of PlayerTable's constrainHeight={false}
  // below is to let the full list flow, so pagination isn't wanted here.
  const { search, setSearch, filteredCount, paginatedItems: filteredPlayers } = useSearchPagination(
    players,
    playerFilterFn
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
        <div className="mb-4">
          <label htmlFor="players-search" className="block spurs-text text-xs font-medium mb-1">
            Search players
          </label>
          <input
            id="players-search"
            type="text"
            placeholder="Search by name, position, or nationality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <p className="spurs-text text-xs opacity-75 mt-1">
              {filteredCount} of {players.length} players
            </p>
          )}
        </div>
        <PlayerTable players={filteredPlayers} constrainHeight={false} showCurrentClub />
      </div>
    </main>
  );
}
