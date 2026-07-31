import { DataTable } from './DataTable';
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
    <DataTable
      records={teams}
      getRowKey={(team) => team.id}
      onRowClick={onSelect}
      emptyMessage="No teams found"
      columns={[
        { key: 'name', label: 'Name', render: (team) => team.name },
        { key: 'short_name', label: 'Short Name', render: (team) => team.short_name },
        { key: 'primary_color', label: 'Primary Color', render: (team) => <ColorSwatch color={team.primary_color} /> },
        { key: 'secondary_color', label: 'Secondary Color', render: (team) => <ColorSwatch color={team.secondary_color} /> },
      ]}
    />
  );
}
