import { renderHook, act } from '@testing-library/react';
import { useSearchPagination } from '../useSearchPagination';

interface Item {
  id: number;
  name: string;
}

const items: Item[] = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
const filterByName = (item: Item, search: string) => item.name.toLowerCase().includes(search.toLowerCase());

describe('useSearchPagination', () => {
  it('paginates the full item list by perPage', () => {
    const { result } = renderHook(() => useSearchPagination(items, filterByName, 10));

    expect(result.current.paginatedItems).toHaveLength(10);
    expect(result.current.paginatedItems[0].id).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.filteredCount).toBe(25);
  });

  it('advances to the requested page', () => {
    const { result } = renderHook(() => useSearchPagination(items, filterByName, 10));

    act(() => result.current.setCurrentPage(2));

    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginatedItems[0].id).toBe(11);
  });

  it('filters items by search and recalculates total pages', () => {
    const { result } = renderHook(() => useSearchPagination(items, filterByName, 10));

    act(() => result.current.setSearch('Item 1'));

    // Matches "Item 1", "Item 10".."Item 19" = 11 items
    expect(result.current.filteredCount).toBe(11);
    expect(result.current.totalPages).toBe(2);
  });

  it('does not reset the current page on search when it is still valid', () => {
    const { result } = renderHook(() => useSearchPagination(items, filterByName, 10));

    act(() => result.current.setCurrentPage(2));
    act(() => result.current.setSearch('Item 1'));

    // 11 matches over 2 pages - page 2 is still in range, so it stays put
    expect(result.current.currentPage).toBe(2);
  });

  it('clamps the current page back when a search shrinks the results below it', () => {
    const { result } = renderHook(() => useSearchPagination(items, filterByName, 10));

    act(() => result.current.setCurrentPage(3));
    act(() => result.current.setSearch('Item 2'));

    // "Item 2" matches "Item 2", "Item 20".."Item 25" = 7 items = 1 page
    expect(result.current.filteredCount).toBe(7);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.currentPage).toBe(1);
  });

  it('returns all items unfiltered when search is empty', () => {
    const { result } = renderHook(() => useSearchPagination(items, filterByName, 10));

    expect(result.current.search).toBe('');
    expect(result.current.filteredCount).toBe(25);
  });

  it('never reports fewer than 1 total page, even with zero matches', () => {
    const { result } = renderHook(() => useSearchPagination(items, filterByName, 10));

    act(() => result.current.setSearch('no such item'));

    expect(result.current.filteredCount).toBe(0);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginatedItems).toHaveLength(0);
  });
});
