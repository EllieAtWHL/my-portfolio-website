import { renderHook, act, waitFor } from '@testing-library/react';
import { useRetryableAsync } from '../useRetryableAsync';

describe('useRetryableAsync', () => {
  it('starts in a loading state and resolves with fetched data', async () => {
    const fetchFn = jest.fn().mockResolvedValue(['a', 'b']);
    const { result } = renderHook(() => useRetryableAsync(fetchFn, [] as string[], []));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(['a', 'b']);
    expect(result.current.hasError).toBe(false);
  });

  it('sets hasError and keeps the previous data on a failed fetch', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useRetryableAsync(fetchFn, [] as string[], []));

    await waitFor(() => expect(result.current.hasError).toBe(true));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it('re-runs the fetch and clears the error when retry() is called', async () => {
    const fetchFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValue(['recovered']);
    const { result } = renderHook(() => useRetryableAsync(fetchFn, [] as string[], []));

    await waitFor(() => expect(result.current.hasError).toBe(true));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.data).toEqual(['recovered']));
    expect(result.current.hasError).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('re-fetches when a dependency changes', async () => {
    const fetchFn = jest.fn().mockResolvedValue('data');
    const { rerender } = renderHook(
      ({ id }: { id: string }) => useRetryableAsync(() => fetchFn(id), '', [id]),
      { initialProps: { id: '1' } }
    );

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

    rerender({ id: '2' });

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2));
    expect(fetchFn).toHaveBeenLastCalledWith('2');
  });
});
