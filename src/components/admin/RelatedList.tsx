import { Button } from '@/components/Button';
import { Pagination } from '@/components/admin/Pagination';
import SearchInput from '@/components/spurs-women/SearchInput';
import { useSearchPagination } from '@/hooks/useSearchPagination';

interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  render?: (value: unknown, record: T) => React.ReactNode;
  /** Overrides the React key when two columns share the same `key` (e.g. both deriving from the same field). */
  id?: string;
}

interface RelatedListSearchConfig<T> {
  /** Used to build the SearchInput's id/label and, combined with `title`, the Pagination's item label. */
  id: string;
  placeholder: string;
  filterFn: (record: T, search: string) => unknown;
  perPage?: number;
}

interface RelatedListProps<T> {
  title: string;
  records: T[];
  columns: ColumnConfig<T>[];
  onNew?: () => void;
  onRecordClick?: (record: T) => void;
  emptyMessage?: string;
  // Opt-in: most related lists (Player History, Media, Stadium Name, a single
  // match's Player Stats squad) stay naturally small and don't need this - only
  // pass it for a list that can grow long (e.g. a player's career Player Stats,
  // see WEB-169), so the rest keep their current simple, unpaginated rendering.
  search?: RelatedListSearchConfig<T>;
}

export function RelatedList<T extends Record<string, unknown> | { id?: string }>({
  title,
  records,
  columns,
  onNew,
  onRecordClick,
  emptyMessage = 'No records found',
  search,
}: RelatedListProps<T>) {
  // Hooks can't be called conditionally, so this always runs - harmless when `search`
  // is omitted, since `filterFn`/`perPage` then just fall back to identity/unpaginated.
  const {
    search: searchValue,
    setSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredCount,
    paginatedItems,
  } = useSearchPagination(records, search?.filterFn ?? (() => true), search?.perPage);

  return (
    <div className="mb-6 border border-gray-600 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
        <h3 className="font-semibold text-white">{title} ({search ? filteredCount : records.length})</h3>
        {onNew && (
          <Button variant="spurs" size="sm" onClick={onNew}>
            New
          </Button>
        )}
      </div>
      {search && records.length > 0 && (
        <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-600">
          <SearchInput
            id={`${search.id}-search`}
            label={`Search ${title}`}
            srOnlyLabel
            placeholder={search.placeholder}
            value={searchValue}
            onChange={setSearch}
          />
        </div>
      )}
      {records.length === 0 ? (
        <div className="p-4 text-center text-gray-400">{emptyMessage}</div>
      ) : paginatedItems.length === 0 ? (
        <div className="p-4 text-center text-gray-400">No {title.toLowerCase()} match your search</div>
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
              {paginatedItems.map((record, index) => (
                <tr
                  key={(record.id as string) || index}
                  className={`border-b border-gray-600 ${
                    onRecordClick ? 'admin-row-focusable cursor-pointer hover:bg-gray-700/50' : ''
                  } transition-colors`}
                  onClick={() => onRecordClick?.(record)}
                  tabIndex={onRecordClick ? 0 : undefined}
                  onKeyDown={onRecordClick ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onRecordClick(record);
                    }
                  } : undefined}
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
      {search && (
        <div className="px-4 pb-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCount}
            perPage={search.perPage ?? filteredCount}
            itemLabel={title.toLowerCase()}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
