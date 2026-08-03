/**
 * Test double for the chainable Supabase query builder (`supabase.from(...).select(...).eq(...)`, etc.)
 * used throughout src/lib/data/*. Real Supabase query builders are thenable - awaiting them directly
 * resolves the same way calling `.single()` does - so this mock supports both styles.
 *
 * Usage:
 *   jest.mock('@/utils/supabase', () => ({
 *     supabase: { from: mockSupabaseFrom({ matches: { data: [...], error: null } }) },
 *   }));
 *
 * For code that calls `.from(table)` more than once per test and needs a different result each
 * time (e.g. generic-fetchers' match-count helpers querying the same table per entity), pass an
 * array - each call consumes the next entry, and the last entry repeats once exhausted.
 */

export interface SupabaseResult<T = unknown> {
  data: T;
  error: { message: string } | Error | null;
  count?: number | null;
}

const CHAIN_METHODS = [
  'select',
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'is',
  'not',
  'or',
  'filter',
  'in',
  'match',
  'order',
  'limit',
  'range',
] as const;

export function createChainableQuery(result: SupabaseResult) {
  const resolved = Promise.resolve(result);

  const chain: Record<string, unknown> = {
    single: jest.fn(() => Promise.resolve(result)),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    then: resolved.then.bind(resolved),
    catch: resolved.catch.bind(resolved),
    finally: resolved.finally.bind(resolved),
  };

  for (const method of CHAIN_METHODS) {
    chain[method] = jest.fn(() => chain);
  }

  return chain;
}

export function mockSupabaseFrom(
  responsesByTable: Record<string, SupabaseResult | SupabaseResult[]>
) {
  const callCounts: Record<string, number> = {};

  return jest.fn((table: string) => {
    const configured = responsesByTable[table];

    if (configured === undefined) {
      throw new Error(
        `mockSupabaseFrom: no response configured for table "${table}". ` +
          `Configured tables: ${Object.keys(responsesByTable).join(', ') || '(none)'}`
      );
    }

    let result: SupabaseResult;
    if (Array.isArray(configured)) {
      const index = callCounts[table] ?? 0;
      result = configured[Math.min(index, configured.length - 1)];
      callCounts[table] = index + 1;
    } else {
      result = configured;
    }

    return createChainableQuery(result);
  });
}
