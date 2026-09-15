import { describe, it, expect, jest } from '@jest/globals';
import { fetchAllPaginated } from '../paginate';

type Page<T> = { data: T[] | null; error: { message: string } | null };

describe('fetchAllPaginated', () => {
  it('returns all rows from a single page under the page size', async () => {
    const fetchPage = jest.fn<(from: number, to: number) => Promise<Page<number>>>(
      async () => ({ data: [1, 2, 3], error: null })
    );

    const result = await fetchAllPaginated(fetchPage, 1000);

    expect(result).toEqual({ data: [1, 2, 3], error: null });
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(0, 999);
  });

  it('pages through multiple full pages and stops at the first short page', async () => {
    const page1 = Array.from({ length: 3 }, (_, i) => i);
    const page2 = Array.from({ length: 3 }, (_, i) => i + 3);
    const page3 = [6];
    const fetchPage = jest.fn<(from: number, to: number) => Promise<Page<number>>>();
    fetchPage
      .mockResolvedValueOnce({ data: page1, error: null })
      .mockResolvedValueOnce({ data: page2, error: null })
      .mockResolvedValueOnce({ data: page3, error: null });

    const result = await fetchAllPaginated(fetchPage, 3);

    expect(result).toEqual({ data: [0, 1, 2, 3, 4, 5, 6], error: null });
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage).toHaveBeenNthCalledWith(1, 0, 2);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 3, 5);
    expect(fetchPage).toHaveBeenNthCalledWith(3, 6, 8);
  });

  it('stops immediately and returns an empty array when the first page is empty', async () => {
    const fetchPage = jest.fn<(from: number, to: number) => Promise<Page<number>>>(
      async () => ({ data: [], error: null })
    );

    const result = await fetchAllPaginated(fetchPage, 1000);

    expect(result).toEqual({ data: [], error: null });
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('treats a null page (Supabase error shape) the same as an empty one and stops', async () => {
    const fetchPage = jest.fn<(from: number, to: number) => Promise<Page<number>>>(
      async () => ({ data: null, error: null })
    );

    const result = await fetchAllPaginated(fetchPage, 1000);

    expect(result).toEqual({ data: [], error: null });
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('stops paging and surfaces the error, keeping whatever rows were already collected', async () => {
    const page1 = Array.from({ length: 3 }, (_, i) => i);
    const fetchPage = jest.fn<(from: number, to: number) => Promise<Page<number>>>();
    fetchPage
      .mockResolvedValueOnce({ data: page1, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'db down' } });

    const result = await fetchAllPaginated(fetchPage, 3);

    expect(result).toEqual({ data: [0, 1, 2], error: { message: 'db down' } });
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});
