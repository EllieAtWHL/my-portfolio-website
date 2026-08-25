import { supabase } from '@/utils/supabase';

/**
 * Common Supabase query builder patterns
 */

/**
 * Build a query with common filters for matches
 */
export function buildMatchQuery() {
  return supabase
    .from('matches_with_stadium')
    .select(`
      *,
      home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
      away_team:away_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
      competitions:competition_id(name, icon_svg)
    `);
}

/**
 * Build a lightweight query for match navigation (prev/next buttons),
 * selecting only the fields needed to render a nav link.
 */
export function buildMatchNavQuery() {
  return supabase
    .from('matches_with_stadium')
    .select(`
      id,
      date,
      home_team:home_team_id(id, name, short_name),
      away_team:away_team_id(id, name, short_name)
    `);
}
