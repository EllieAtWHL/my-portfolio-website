import { DataTable } from './DataTable';
import type { Player } from '@/types/spurs-women-admin';

interface PlayersTableProps {
  players: Player[];
  onSelect: (player: Player) => void;
}

export function PlayersTable({ players, onSelect }: PlayersTableProps) {
  return (
    <DataTable
      records={players}
      getRowKey={(player) => player.id}
      onRowClick={onSelect}
      emptyMessage="No players found"
      columns={[
        {
          key: 'name',
          label: 'Name',
          render: (player) => <>{player.first_name ? `${player.first_name} ` : ''}{player.last_name}</>,
        },
        { key: 'position', label: 'Position', render: (player) => player.position || '-' },
        { key: 'nationality', label: 'Nationality', render: (player) => player.nationality || '-' },
      ]}
    />
  );
}
