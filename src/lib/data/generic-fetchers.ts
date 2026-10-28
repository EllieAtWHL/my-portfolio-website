import { supabase } from '@/utils/supabase';
import { fetchAllPaginated } from '@/lib/utils/paginate';

/**
 * Equality filters applied to a generic fetch, e.g. `{ spurs_women: true }`
 * to keep Groundhopper-only grounds off the Spurs Women stadium pages.
 */
export type EqualityFilters = Record<string, string | number | boolean>;

/**
 * Generic function to fetch all records from a table with optional ordering, paginated via
 * fetchAllPaginated so a table that grows past PostgREST's 1000-row response cap isn't
 * silently truncated (WEB-168). Ordered by `id` after the caller's column as a unique
 * tiebreaker, so rows that tie on that column (e.g. two grounds with the same name) have a
 * deterministic order and can't be skipped or duplicated at a page boundary within a single read.
 */
export async function fetchAllFromDB<T>(
  tableName: string,
  orderByColumn: string = 'name',
  ascending: boolean = true,
  filters: EqualityFilters = {}
): Promise<T[]> {
  const { data, error } = await fetchAllPaginated<T>((from, to) =>
    supabase
      .from(tableName)
      .select('*')
      .match(filters)
      .order(orderByColumn, { ascending })
      .order('id', { ascending: true })
      .range(from, to)
  );

  if (error) {
    console.error(`Error fetching ${tableName}:`, error);
    throw error;
  }

  return data;
}

/**
 * Generic function to fetch a single record by ID
 */
export async function fetchByIdFromDB<T>(
  tableName: string,
  id: string | number
): Promise<T | null> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching ${tableName} by ID:`, error);
    return null;
  }

  return data as T;
}

/**
 * Fetches the given column for every match and reduces it to a per-id count, for the caller
 * to look up its entities in. Deliberately not filtered with `.in(matchColumn, ids)`: the id
 * list goes into the request URL, so a paginated entity list past a few hundred rows could
 * exceed URL length limits - and counting every match is no more rows than the matches
 * table itself, which this pages through anyway.
 */
async function fetchColumnCounts(
  matchTableName: string,
  matchColumn: string
): Promise<Map<string | number, number>> {
  const counts = new Map<string | number, number>();

  // One row per match, so this grows with the matches table rather than the (much smaller)
  // entity table - paginated for the same reason as fetchAllFromDB.
  const { data, error } = await fetchAllPaginated((from, to) =>
    supabase
      .from(matchTableName)
      .select(matchColumn)
      .order('id', { ascending: true })
      .range(from, to)
  );

  if (error) {
    console.error(`Error fetching ${matchColumn} counts from ${matchTableName}:`, error);
    return counts;
  }

  for (const row of data as unknown as Record<string, string | number | null>[]) {
    const id = row[matchColumn];
    if (id !== null && id !== undefined) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  return counts;
}

/**
 * Generic function to fetch records with match count aggregation
 * Counts matches where the entity appears in either of two columns (e.g., home_team_id or away_team_id)
 */
export async function fetchWithMatchCountFromDB<T extends { id: string | number }>(
  tableName: string,
  matchTableName: string = 'matches',
  matchColumn1: string = 'home_team_id',
  matchColumn2: string = 'away_team_id',
  orderByColumn: string = 'name'
): Promise<(T & { match_count: number })[]> {
  const entities = await fetchAllFromDB<T>(tableName, orderByColumn);
  if (entities.length === 0) {
    return [];
  }

  const [counts1, counts2] = await Promise.all([
    fetchColumnCounts(matchTableName, matchColumn1),
    fetchColumnCounts(matchTableName, matchColumn2),
  ]);

  return entities.map((entity) => ({
    ...entity,
    match_count: (counts1.get(entity.id) ?? 0) + (counts2.get(entity.id) ?? 0),
  }));
}

/**
 * Generic function to fetch records with match count aggregation (single column)
 * Counts matches where the entity appears in a single column (e.g., stadium_id)
 */
export async function fetchWithSingleMatchCountFromDB<T extends { id: string | number }>(
  tableName: string,
  matchTableName: string = 'matches',
  matchColumn: string = 'stadium_id',
  orderByColumn: string = 'name',
  filters: EqualityFilters = {}
): Promise<(T & { match_count: number })[]> {
  const entities = await fetchAllFromDB<T>(tableName, orderByColumn, true, filters);
  if (entities.length === 0) {
    return [];
  }

  const counts = await fetchColumnCounts(matchTableName, matchColumn);

  return entities.map((entity) => ({
    ...entity,
    match_count: counts.get(entity.id) ?? 0,
  }));
}
