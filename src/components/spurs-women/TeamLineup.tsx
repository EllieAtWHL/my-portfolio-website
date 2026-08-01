'use client';

import { useState } from 'react';
import type { TeamLineup } from '@/lib/data/players';
import PlayerRow from './PlayerRow';

interface TeamLineupProps {
  lineup: TeamLineup;
}

type LineupTab = 'starters' | 'substitutes' | 'unused';

export default function TeamLineup({ lineup }: TeamLineupProps) {
  const [activeTab, setActiveTab] = useState<LineupTab>('starters');

  const sortByPosition = (players: typeof lineup.players) => {
    const positionOrder: Record<string, number> = {
      'Goalkeeper': 0,
      'GK': 0,
      'Goalkeeper (GK)': 0,
      'Defender': 1,
      'DEF': 1,
      'Defender (DEF)': 1,
      'Centre-Back': 1,
      'Full-Back': 1,
      'Wing-Back': 1,
      'Midfielder': 2,
      'MID': 2,
      'Midfielder (MID)': 2,
      'Central Midfielder': 2,
      'Defensive Midfielder': 2,
      'Attacking Midfielder': 2,
      'Wide Midfielder': 2,
      'Forward': 3,
      'FWD': 3,
      'Forward (FWD)': 3,
      'Centre-Forward': 3,
      'Winger': 3,
      'Striker': 3
    };

    return players.sort((a, b) => {
      const aPos = a.position?.toLowerCase().trim() || '';
      const bPos = b.position?.toLowerCase().trim() || '';
      
      // Try exact match first (case-insensitive)
      let aOrder = positionOrder[aPos] ?? positionOrder[aPos.charAt(0).toUpperCase() + aPos.slice(1)];
      let bOrder = positionOrder[bPos] ?? positionOrder[bPos.charAt(0).toUpperCase() + bPos.slice(1)];
      
      // If still not found, try partial matches
      if (aOrder === undefined) {
        if (aPos.includes('goalkeeper') || aPos.includes('gk')) aOrder = 0;
        else if (aPos.includes('defender') || aPos.includes('def') || aPos.includes('back')) aOrder = 1;
        else if (aPos.includes('midfielder') || aPos.includes('mid')) aOrder = 2;
        else if (aPos.includes('forward') || aPos.includes('fwd') || aPos.includes('striker') || aPos.includes('winger')) aOrder = 3;
        else aOrder = 999;
      }
      
      if (bOrder === undefined) {
        if (bPos.includes('goalkeeper') || bPos.includes('gk')) bOrder = 0;
        else if (bPos.includes('defender') || bPos.includes('def') || bPos.includes('back')) bOrder = 1;
        else if (bPos.includes('midfielder') || bPos.includes('mid')) bOrder = 2;
        else if (bPos.includes('forward') || bPos.includes('fwd') || bPos.includes('striker') || bPos.includes('winger')) bOrder = 3;
        else bOrder = 999;
      }
      
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

  const getTabClassName = (tab: LineupTab) => {
    const isActive = activeTab === tab;
    return `px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm border-b-2 ${
      isActive
        ? 'text-[var(--spurs-dark-accent)] bg-[var(--spurs-dark-bg-1)] border-[var(--spurs-dark-accent)]'
        : 'text-gray-300 hover:text-[var(--spurs-dark-accent)] bg-[var(--spurs-dark-opacity-30)] border-transparent'
    }`;
  };

  return (
    <div className="mb-8">
      {!hasNoStats && (
        <>
          {/* Tabs */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setActiveTab('starters')}
              className={getTabClassName('starters')}
              disabled={sortedStarters.length === 0}
            >
              Starting XI ({sortedStarters.length})
            </button>
            <button
              onClick={() => setActiveTab('substitutes')}
              className={getTabClassName('substitutes')}
              disabled={sortedSubstitutes.length === 0}
            >
              Substitutes ({sortedSubstitutes.length})
            </button>
            <button
              onClick={() => setActiveTab('unused')}
              className={getTabClassName('unused')}
              disabled={sortedUnusedSubstitutes.length === 0}
            >
              Unused ({sortedUnusedSubstitutes.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-spurs-dark rounded-lg border border-slate-200 overflow-hidden">
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
        <div className="bg-spurs-dark rounded-lg border border-slate-200 overflow-hidden">
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
