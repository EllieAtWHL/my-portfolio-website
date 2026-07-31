import { getTeamColor } from '@/lib/utils/team-colors';
import type { Team } from '@/types/spurs-women-admin';

interface TeamsTableProps {
  teams: Team[];
  onSelect: (team: Team) => void;
}

function ColorSwatch({ color }: { color: string | null }) {
  return (
    <div className="flex items-center space-x-2">
      {color ? (
        <div
          className="w-6 h-6 rounded border border-gray-400"
          style={{ backgroundColor: getTeamColor(color) }}
          title={color}
        />
      ) : (
        <div className="w-6 h-6 rounded border border-gray-400 bg-gray-600" title="No color" />
      )}
      <span className="text-xs">{color || '-'}</span>
    </div>
  );
}

export function TeamsTable({ teams, onSelect }: TeamsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-600">
            <th className="text-left p-2 spurs-text">Name</th>
            <th className="text-left p-2 spurs-text">Short Name</th>
            <th className="text-left p-2 spurs-text">Primary Color</th>
            <th className="text-left p-2 spurs-text">Secondary Color</th>
          </tr>
        </thead>
        <tbody>
          {teams.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-2 text-center text-gray-400">
                No teams found
              </td>
            </tr>
          ) : (
            teams.map(team => (
              <tr
                key={team.id}
                className="border-b border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => onSelect(team)}
              >
                <td className="p-2 spurs-text">{team.name}</td>
                <td className="p-2 spurs-text">{team.short_name}</td>
                <td className="p-2 spurs-text"><ColorSwatch color={team.primary_color} /></td>
                <td className="p-2 spurs-text"><ColorSwatch color={team.secondary_color} /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
