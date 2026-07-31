import { useMemo, useState } from 'react';

/**
 * Shared search + pagination behaviour for the admin entity lists (matches,
 * teams, players, stadiums). `filterFn` is only invoked when `search` is
 * non-empty, so it's safe to skip a case-insensitivity check on `search`
 * itself as long as `filterFn` lower-cases the fields it compares.
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
