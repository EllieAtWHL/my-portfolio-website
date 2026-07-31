import { DataTable } from './DataTable';
import type { Stadium } from '@/types/spurs-women-admin';

interface StadiumsTableProps {
  stadiums: Stadium[];
  onSelect: (stadium: Stadium) => void;
}

export function StadiumsTable({ stadiums, onSelect }: StadiumsTableProps) {
  return (
    <DataTable
      records={stadiums}
      getRowKey={(stadium) => stadium.id}
      onRowClick={onSelect}
      emptyMessage="No stadiums found"
      columns={[
        { key: 'name', label: 'Name', render: (stadium) => stadium.name },
        { key: 'city', label: 'City', render: (stadium) => stadium.city || '-' },
        { key: 'capacity', label: 'Capacity', render: (stadium) => stadium.capacity || '-' },
      ]}
    />
  );
}
