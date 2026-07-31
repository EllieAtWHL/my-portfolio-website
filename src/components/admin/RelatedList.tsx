import { Button } from '@/components/Button';

interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  render?: (value: unknown, record: T) => React.ReactNode;
  /** Overrides the React key when two columns share the same `key` (e.g. both deriving from the same field). */
  id?: string;
}

interface RelatedListProps<T> {
  title: string;
  records: T[];
  columns: ColumnConfig<T>[];
  onNew?: () => void;
  onRecordClick?: (record: T) => void;
  emptyMessage?: string;
}

export function RelatedList<T extends Record<string, unknown> | { id?: string }>({
  title,
  records,
  columns,
  onNew,
  onRecordClick,
  emptyMessage = 'No records found',
}: RelatedListProps<T>) {
  return (
    <div className="mb-6 border border-gray-600 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
        <h3 className="font-semibold text-white">{title} ({records.length})</h3>
        {onNew && (
          <Button variant="spurs" size="sm" onClick={onNew}>
            New
          </Button>
        )}
      </div>
      {records.length === 0 ? (
        <div className="p-4 text-center text-gray-400">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600 bg-gray-800/50">
                {columns.map((column) => (
                  <th key={column.id ?? String(column.key)} className="text-left p-2 text-gray-300">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr
                  key={(record.id as string) || index}
                  className={`border-b border-gray-600 ${
                    onRecordClick ? 'cursor-pointer hover:bg-gray-700/50' : ''
                  } transition-colors`}
                  onClick={() => onRecordClick?.(record)}
                >
                  {columns.map((column) => (
                    <td key={column.id ?? String(column.key)} className="p-2 text-gray-300">
                      {column.render
                        ? column.render(record[column.key], record)
                        : (record[column.key] as string | number | null) ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
