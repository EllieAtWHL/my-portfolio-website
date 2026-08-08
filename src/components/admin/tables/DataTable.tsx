import type { ReactNode } from 'react';

interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (record: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  records: T[];
  getRowKey: (record: T) => string | number;
  onRowClick: (record: T) => void;
  emptyMessage: string;
}

export function DataTable<T>({ columns, records, getRowKey, onRowClick, emptyMessage }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-600">
            {columns.map((column) => (
              <th key={column.key} className="text-left p-2 spurs-text">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-2 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr
                key={getRowKey(record)}
                className="admin-row-focusable border-b border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => onRowClick(record)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onRowClick(record);
                  }
                }}
              >
                {columns.map((column) => (
                  <td key={column.key} className="p-2 spurs-text">{column.render(record)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
