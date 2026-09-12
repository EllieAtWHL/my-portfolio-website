import { useMemo, useState } from 'react';

/**
 * Shared search + pagination behaviour, originally for the admin entity
 * lists (matches, teams, players, stadiums) but generic enough for any
 * client-rendered list - a public page that wants search without pagination
 * can pass `Number.MAX_SAFE_INTEGER` for `perPage` (see the players index
 * page) to make the pagination a no-op. Don't pass `Infinity` for this:
 * the page-offset math below is `(currentPage - 1) * perPage`, and
 * `0 * Infinity` is `NaN`, which - since `Array.prototype.slice` coerces a
 * NaN index to 0 - collapses `paginatedItems` to an always-empty array
 * regardless of how many items there are. `filterFn` is only invoked when
 * `search` is non-empty, so it's safe to skip a case-insensitivity check on
 * `search` itself as long as `filterFn` lower-cases the fields it compares.
 */
export function useSearchPagination<T>(
  items: T[],
  filterFn: (item: T, search: string) => unknown,
  perPage: number
) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(
    () => (search ? items.filter((item) => filterFn(item, search)) : items),
    [items, search, filterFn]
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  // Adjusting state during render, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [filteredItems, safeCurrentPage, perPage]);

  return {
    search,
    setSearch,
    currentPage: safeCurrentPage,
    setCurrentPage,
    totalPages,
    filteredCount: filteredItems.length,
    paginatedItems,
  };
}
