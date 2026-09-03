import { useState } from 'react';
import Link from 'next/link';
import LegacyNumberBadge from '@/components/spurs-women/LegacyNumberBadge';
import { PlayerWithStats } from '@/lib/data/teams';

interface PlayerTableProps {
  players: PlayerWithStats[];
}

type SortColumn = 'squad_number' | 'name' | 'nationality' | 'position' | 'appearances' | 'goals' | 'assists' | 'yellow_cards' | 'red_cards';
type SortDirection = 'asc' | 'desc';

export default function PlayerTable({ players }: PlayerTableProps) {
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
        case 'squad_number':
          aValue = a.squad_number ?? 999;
          bValue = b.squad_number ?? 999;
          break;
        case 'name':
          aValue = `${a.last_name}, ${a.first_name || ''}`.toLowerCase();
          bValue = `${b.last_name}, ${b.first_name || ''}`.toLowerCase();
          break;
        case 'nationality':
          aValue = (a.nationality || '').toLowerCase();
          bValue = (b.nationality || '').toLowerCase();
          break;
        case 'position':
          aValue = (a.position || '').toLowerCase();
          bValue = (b.position || '').toLowerCase();
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
    <div className="overflow-x-auto max-h-96 overflow-y-auto">
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
                {player.squad_number || '-'}
              </td>
              <td className="py-3 px-4 spurs-text">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/spurs-women/players/${player.id}`}
                    className="font-medium hover:underline transition-colors"
                    style={{ color: 'var(--spurs-dark-text)' }}
                  >
                    {player.first_name && `${player.first_name} `}{player.last_name}
                  </Link>
                  {player.legacy_number != null && (
                    <LegacyNumberBadge number={player.legacy_number} size="sm" />
                  )}
                </div>
              </td>
              <td className="py-3 px-4 spurs-text opacity-75">
                {player.nationality || '-'}
              </td>
              <td className="py-3 px-4 spurs-text opacity-75">
                {player.position || '-'}
              </td>
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
