'use client';

import { useCallback, useEffect, useState, type DependencyList } from 'react';

interface UseRetryableAsyncResult<T> {
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  loading: boolean;
  hasError: boolean;
  retry: () => void;
}

/**
 * Fetches `fetchFn` on mount and whenever `deps` changes, with a `retry()` to
 * re-run it (e.g. from an ErrorState's "Try Again" button).
 */
export function useRetryableAsync<T>(
  fetchFn: () => Promise<T>,
  initialData: T,
  deps: DependencyList = [],
  errorLogMessage = 'Error fetching data:'
): UseRetryableAsyncResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch logic stays local to the effect (rather than a shared useCallback
  // also called from the retry button) - keeps react-hooks/set-state-in-effect
  // happy, since it flags a memoized fetch function reachable from both an
  // effect and an external handler even though these setState calls only
  // ever run after the awaited request settles. Retrying bumps retryCount
  // to re-trigger this same effect.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const result = await fetchFn();
        if (cancelled) return;
        setData(result);
        setHasError(false);
      } catch (error) {
        if (cancelled) return;
        console.error(errorLogMessage, error);
        setHasError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
    // fetchFn/errorLogMessage are intentionally omitted from deps (see comment
    // above) - callers pass their own route-param deps to key the fetch on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount, ...deps]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);

  return { data, setData, loading, hasError, retry };
}
