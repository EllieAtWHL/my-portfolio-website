import { supabase } from '@/utils/supabase';

/**
 * Generic function to fetch all records from a table with optional ordering
 */
export async function fetchAllFromDB<T>(
  tableName: string,
  orderByColumn: string = 'name',
  ascending: boolean = true
): Promise<T[]> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order(orderByColumn, { ascending });

  if (error) {
    console.error(`Error fetching ${tableName}:`, error);
    throw error;
  }

  return data as T[];
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
  // Fetch entities first
  const { data: entitiesData, error: entitiesError } = await supabase
    .from(tableName)
    .select('*')
    .order(orderByColumn);

  if (entitiesError) {
    console.error(`Error fetching ${tableName}:`, entitiesError);
    throw entitiesError;
  }

  // Fetch match counts for each entity
  const entitiesWithCounts = await Promise.all(
    (entitiesData as T[]).map(async (entity) => {
      const { count: count1, error: error1 } = await supabase
        .from(matchTableName)
        .select('*', { count: 'exact', head: true })
        .eq(matchColumn1, entity.id);

      const { count: count2, error: error2 } = await supabase
        .from(matchTableName)
        .select('*', { count: 'exact', head: true })
        .eq(matchColumn2, entity.id);

      const totalMatches = (error1 ? 0 : count1 || 0) + (error2 ? 0 : count2 || 0);

      return {
        ...entity,
        match_count: totalMatches
      };
    })
  );

  return entitiesWithCounts;
}

/**
 * Generic function to fetch records with match count aggregation (single column)
 * Counts matches where the entity appears in a single column (e.g., stadium_id)
 */
export async function fetchWithSingleMatchCountFromDB<T extends { id: string | number }>(
  tableName: string,
  matchTableName: string = 'matches',
  matchColumn: string = 'stadium_id',
  orderByColumn: string = 'name'
): Promise<(T & { match_count: number })[]> {
  // Fetch entities first
  const { data: entitiesData, error: entitiesError } = await supabase
    .from(tableName)
    .select('*')
    .order(orderByColumn);

  if (entitiesError) {
    console.error(`Error fetching ${tableName}:`, entitiesError);
    throw entitiesError;
  }

  // Fetch match counts for each entity
  const entitiesWithCounts = await Promise.all(
    (entitiesData as T[]).map(async (entity) => {
      const { count, error: countError } = await supabase
        .from(matchTableName)
        .select('*', { count: 'exact', head: true })
        .eq(matchColumn, entity.id);

      return {
        ...entity,
        match_count: countError ? 0 : count || 0
      };
    })
  );

  return entitiesWithCounts;
}
