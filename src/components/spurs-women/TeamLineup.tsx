'use client';

import { useState } from 'react';
import type { TeamLineup } from '@/lib/data/players';
import { getPositionSortOrder } from '@/lib/utils/player-position';
import PlayerRow from './PlayerRow';
import SpursTabButton from './SpursTabButton';

interface TeamLineupProps {
  lineup: TeamLineup;
}

type LineupTab = 'starters' | 'substitutes' | 'unused';

// Positions with no recognisable GK/DEF/MID/FWD keyword sort last.
const UNKNOWN_POSITION_ORDER = 999;

export default function TeamLineup({ lineup }: TeamLineupProps) {
  const [activeTab, setActiveTab] = useState<LineupTab>('starters');

  const sortByPosition = (players: typeof lineup.players) => {
    return players.sort((a, b) => {
      const aOrder = getPositionSortOrder(a.position) ?? UNKNOWN_POSITION_ORDER;
      const bOrder = getPositionSortOrder(b.position) ?? UNKNOWN_POSITION_ORDER;
      return aOrder - bOrder;
    });
  };

  const sortedStarters = sortByPosition(lineup.players.filter(p => p.player_stats?.started));
  const sortedSubstitutes = sortByPosition(lineup.players.filter(p => p.player_stats?.was_substitute));
  const sortedUnusedSubstitutes = sortByPosition(lineup.players.filter(p => p.player_stats?.was_unused_substitute));

  // Get players to display based on active tab
  const getPlayersForTab = () => {
    switch (activeTab) {
      case 'starters':
        return sortedStarters;
      case 'substitutes':
        return sortedSubstitutes;
      case 'unused':
        return sortedUnusedSubstitutes;
      default:
        return [];
    }
  };

  const displayedPlayers = getPlayersForTab();

  // Fallback for players without stats
  const hasNoStats = sortedStarters.length === 0 && sortedSubstitutes.length === 0 && sortedUnusedSubstitutes.length === 0;

  const tabs: { key: LineupTab; label: string; count: number }[] = [
    { key: 'starters', label: 'Starting XI', count: sortedStarters.length },
    { key: 'substitutes', label: 'Substitutes', count: sortedSubstitutes.length },
    { key: 'unused', label: 'Unused', count: sortedUnusedSubstitutes.length },
  ];

  return (
    <div className="mb-8">
      {!hasNoStats && (
        <>
          {/* Tabs */}
          <div className="flex gap-4 mb-4">
            {tabs.map((tab) => (
              <SpursTabButton
                key={tab.key}
                isActive={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                disabled={tab.count === 0}
              >
                {tab.label} ({tab.count})
              </SpursTabButton>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-[var(--spurs-dark-bg-1)] rounded-lg border border-slate-200 overflow-hidden">
            {displayedPlayers.length > 0 ? (
              displayedPlayers.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                />
              ))
            ) : (
              <div className="p-4 text-center text-gray-400">
                No players in this category
              </div>
            )}
          </div>
        </>
      )}

      {/* Players without stats (fallback) */}
      {hasNoStats && (
        <div className="bg-[var(--spurs-dark-bg-1)] rounded-lg border border-slate-200 overflow-hidden">
          {sortByPosition(lineup.players).map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
            />
          ))}
        </div>
      )}
    </div>
  );
}
