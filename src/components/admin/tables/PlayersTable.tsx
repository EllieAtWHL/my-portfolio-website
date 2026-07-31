import type { Player } from '@/types/spurs-women-admin';

interface PlayersTableProps {
  players: Player[];
  onSelect: (player: Player) => void;
}

export function PlayersTable({ players, onSelect }: PlayersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-600">
            <th className="text-left p-2 spurs-text">Name</th>
            <th className="text-left p-2 spurs-text">Position</th>
            <th className="text-left p-2 spurs-text">Nationality</th>
          </tr>
        </thead>
        <tbody>
          {players.length === 0 ? (
            <tr>
              <td colSpan={3} className="p-2 text-center text-gray-400">
                No players found
              </td>
            </tr>
          ) : (
            players.map(player => (
              <tr
                key={player.id}
                className="border-b border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => onSelect(player)}
              >
                <td className="p-2 spurs-text">{player.first_name ? `${player.first_name} ` : ''}{player.last_name}</td>
                <td className="p-2 spurs-text">{player.position || '-'}</td>
                <td className="p-2 spurs-text">{player.nationality || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
