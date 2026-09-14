import { useState } from 'react';
import Link from 'next/link';
import LegacyNumberBadge from '@/components/spurs-women/LegacyNumberBadge';
import { getPositionSortOrder } from '@/lib/utils/player-position';
import { compareNullableNumbers } from '@/lib/utils/sort';
import { PlayerWithStats } from '@/lib/data/teams';

interface PlayerTableProps {
  players: PlayerWithStats[];
  // Caps the table at a fixed height with its own internal scrollbar - a good
  // fit when the table sits alongside other content (e.g. the team roster
  // page's tabs/stadium card), but not for a page where the table is the
  // only content and should just flow to its full length.
  constrainHeight?: boolean;
  // Only getAllPlayers (the all-players index) resolves current_club - a
  // team-scoped fetch like getPlayersForTeam doesn't, since a roster page's
  // Current/Former tabs already communicate a player's status at that team.
  // Off by default so the column doesn't show a misleading dash for every
  // row wherever it's left unresolved.
  showCurrentClub?: boolean;
}

type SortColumn = 'squad_number' | 'name' | 'nationality' | 'position' | 'current_club' | 'appearances' | 'goals' | 'assists' | 'yellow_cards' | 'red_cards' | 'legacy_number';
type SortDirection = 'asc' | 'desc';

export default function PlayerTable({ players, constrainHeight = true, showCurrentClub = false }: PlayerTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedPlayers = () => {
    const sorted = [...players];
    sorted.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortColumn) {
        // Matters more now than when this table only ever showed a team's
        // current squad (all numbered): the all-players index also lists
        // players with no squad number.
        case 'squad_number':
          return compareNullableNumbers(a.squad_number, b.squad_number, sortDirection);
        case 'name':
          aValue = `${a.last_name}, ${a.first_name || ''}`.toLowerCase();
          bValue = `${b.last_name}, ${b.first_name || ''}`.toLowerCase();
          break;
        case 'nationality':
          aValue = (a.nationality || '').toLowerCase();
          bValue = (b.nationality || '').toLowerCase();
          break;
        // On-pitch order (Goalkeeper, Defender, Midfielder, Forward), not
        // alphabetical - see getPositionSortOrder.
        case 'position':
          return compareNullableNumbers(getPositionSortOrder(a.position), getPositionSortOrder(b.position), sortDirection);
        case 'current_club':
          aValue = (a.current_club?.name || '').toLowerCase();
          bValue = (b.current_club?.name || '').toLowerCase();
          break;
        case 'appearances':
          aValue = a.appearances;
          bValue = b.appearances;
          break;
        case 'goals':
          aValue = a.goals;
          bValue = b.goals;
          break;
        case 'assists':
          aValue = a.assists;
          bValue = b.assists;
          break;
        case 'yellow_cards':
          aValue = a.yellow_cards;
          bValue = b.yellow_cards;
          break;
        case 'red_cards':
          aValue = a.red_cards;
          bValue = b.red_cards;
          break;
        case 'legacy_number':
          return compareNullableNumbers(a.legacy_number, b.legacy_number, sortDirection);
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const getSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const sortedPlayers = getSortedPlayers();

  if (players.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No players to display
      </div>
    );
  }

  return (
    <div className={constrainHeight ? 'overflow-x-auto max-h-96 overflow-y-auto' : 'overflow-x-auto'}>
      <table className="w-full">
        <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--spurs-dark-bg-1)' }}>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th 
              className="text-center py-3 px-4 spurs-text font-semibold cursor-pointer hover:opacity-80"
              onClick={() => handleSort('squad_number')}
            >
              #{getSortIndicator('squad_number')}
            </th>
            <th
              className="text-center py-3 px-4 spurs-text font-semibold cursor-pointer hover:opacity-80"
              onClick={() => handleSort('legacy_number')}
            >
              Legacy #{getSortIndicator('legacy_number')}
            </th>
            <th
              className="text-left py-3 px-4 spurs-text font-semibold cursor-pointer hover:opacity-80"
              onClick={() => handleSort('name')}
            >
              Name{getSortIndicator('name')}
            </th>
            <th 
              className="text-left py-3 px-4 spurs-text font-semibold cursor-pointer hover:opacity-80"
              onClick={() => handleSort('nationality')}
            >
              Nationality{getSortIndicator('nationality')}
            </th>
            <th 
              className="text-left py-3 px-4 spurs-text font-semibold cursor-pointer hover:opacity-80"
              onClick={() => handleSort('position')}
            >
              Position{getSortIndicator('position')}
            </th>
            {showCurrentClub && (
              <th
                className="text-left py-3 px-4 spurs-text font-semibold cursor-pointer hover:opacity-80"
                onClick={() => handleSort('current_club')}
              >
                Current Club{getSortIndicator('current_club')}
              </th>
            )}
            <th
              className="text-center py-3 px-4 spurs-text font-semibold cursor-pointer hover:opacity-80"
              onClick={() => handleSort('appearances')}
            >
              Apps{getSortIndicator('appearances')}
            </th>
            <th 
              className="text-center py-3 px-4 spurs-text font-semibold cursor-pointer hover:opacity-80"
              onClick={() => handleSort('goals')}
            >
              Goals{getSortIndicator('goals')}
            </th>
            <th 
              className="text-center py-3 px-4 spurs-text font-semibold cursor-pointer hover:opacity-80"
              onClick={() => handleSort('assists')}
            >
              Assists{getSortIndicator('assists')}
            </th>
            <th 
              className="text-center py-3 px-4 spurs-text font-semibold cursor-pointer hover:opacity-80"
              onClick={() => handleSort('yellow_cards')}
            >
              Yellows{getSortIndicator('yellow_cards')}
            </th>
            <th 
              className="text-center py-3 px-4 spurs-text font-semibold cursor-pointer hover:opacity-80"
              onClick={() => handleSort('red_cards')}
            >
              Reds{getSortIndicator('red_cards')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player) => (
            <tr key={player.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-[var(--spurs-opacity-20)]">
              <td className="py-3 px-4 text-center spurs-text font-bold">
                {/* `||` rather than `!= null`: a genuine squad_number of 0 would show '-' too -
                    known limitation, see the matching note in getSquadNumberFromHistory */}
                {player.squad_number || '-'}
              </td>
              <td className="py-3 px-4 text-center spurs-text">
                {player.legacy_number != null ? (
                  <LegacyNumberBadge number={player.legacy_number} size="sm" />
                ) : '-'}
              </td>
              <td className="py-3 px-4 spurs-text">
                <Link
                  href={`/spurs-women/players/${player.id}`}
                  className="font-medium hover:underline transition-colors"
                  style={{ color: 'var(--spurs-dark-text)' }}
                >
                  {player.first_name && `${player.first_name} `}{player.last_name}
                </Link>
              </td>
              <td className="py-3 px-4 spurs-text opacity-75">
                {player.nationality || '-'}
              </td>
              <td className="py-3 px-4 spurs-text opacity-75">
                {player.position || '-'}
              </td>
              {showCurrentClub && (
                <td className="py-3 px-4 spurs-text opacity-75">
                  {player.current_club
                    ? player.current_club.onLoanFrom
                      ? `${player.current_club.name} (on loan from ${player.current_club.onLoanFrom.name})`
                      : player.current_club.name
                    : '-'}
                </td>
              )}
              <td className="py-3 px-4 text-center spurs-text">
                {player.appearances}
              </td>
              <td className="py-3 px-4 text-center spurs-text">
                {player.goals}
              </td>
              <td className="py-3 px-4 text-center spurs-text">
                {player.assists}
              </td>
              <td className="py-3 px-4 text-center spurs-text">
                {player.yellow_cards}
              </td>
              <td className="py-3 px-4 text-center spurs-text">
                {player.red_cards}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
