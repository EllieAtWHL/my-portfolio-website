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

/**
 * Build a query with common filters for player stats
 */
export function buildPlayerStatsQuery() {
  return supabase
    .from('player_stats')
    .select(`
      *,
      player:players(id, first_name, last_name, squad_number),
      team:teams(id, name, short_name),
      match:matches(id, date, home_team_id, away_team_id, spurs_score, opponent_score)
    `);
}

/**
 * Build a query with common filters for player history
 */
export function buildPlayerHistoryQuery() {
  return supabase
    .from('player_history')
    .select(`
      *,
      player:players(id, first_name, last_name),
      team:teams(id, name, short_name)
    `);
}

/**
 * Build a query with common filters for teams with relations
 */
export function buildTeamWithRelationsQuery() {
  return supabase
    .from('teams')
    .select('*');
}

/**
 * Build a query with common filters for stadiums with relations
 */
export function buildStadiumWithRelationsQuery() {
  return supabase
    .from('stadia')
    .select(`
      *,
      home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham)
    `);
}
