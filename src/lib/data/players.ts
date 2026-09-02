import { supabase } from '@/utils/supabase';
import { createCachedFunction, CACHE_TAGS } from './cache-utils';
import { Match } from './matches';

export interface PlayerHistoryEntry {
  team: { id: number; name: string } | null;
  joined_on: string | null;
  left_on: string | null;
  squad_number: number | null;
  is_loan: boolean;
}

export interface Player {
  id: string;
  first_name: string | null;
  last_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  profile_image_url: string | null;
  squad_number: number | null;
  legacy_number: number | null;
  current_club?: { id: number; name: string } | null;
  history?: PlayerHistoryEntry[];
  created_at: string;
  updated_at: string;
}

export interface PlayerStats {
  id: string;
  player_id: string;
  match_id: string;
  team_id: number;
  started: boolean;
  captain?: boolean;
  was_substitute: boolean;
  was_unused_substitute: boolean;
  minute_on: number | null;
  minute_off: number | null;
  minutes_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheet: boolean | null;
  saves: number | null;
  shots: number;
  shots_on_target: number;
  passes_completed: number | null;
  passes_attempted: number | null;
  tackles: number | null;
  interceptions: number | null;
  clearances: number | null;
  fouls_committed: number | null;
  fouls_won: number | null;
  offsides: number | null;
  player_rating: number | null;
  player_of_the_match: boolean;
  created_at: string;
}

export interface PlayerWithStats extends Player {
  player_stats: PlayerStats | null;
}

export interface TeamLineup {
  team_id: number;
  players: PlayerWithStats[];
}

// Helper function to find the correct squad number from player_history as of a
// given reference date (the match date for match lineups, or today for a
// player's current squad number) - not always "today", since a squad number
// active at match time may since have changed or lapsed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSquadNumberFromHistory(player: any, referenceDate: Date = new Date()): number | null {
  // Find the correct player_history record for this team (team_id = 1 for Tottenham)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relevantHistory = player?.player_history?.find((history: any) =>
    history.team_id === 1 &&
    (!history.joined_on || new Date(history.joined_on) <= referenceDate) &&
    (!history.left_on || new Date(history.left_on) > referenceDate)
  );

  return relevantHistory?.squad_number || null;
}

// Helper function to find a player's current club (any team, not just Tottenham) from player_history
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCurrentClubFromHistory(player: any): { id: number; name: string } | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentHistory = player?.player_history?.find((history: any) =>
    !history.left_on || new Date(history.left_on) > new Date()
  );

  return currentHistory?.team ? { id: currentHistory.team.id, name: currentHistory.team.name } : null;
}

// Helper function to build a player's full club history (all teams, ongoing stint first,
// then most recently joined first) from their raw player_history rows.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getHistoryFromRecord(player: any): PlayerHistoryEntry[] {
  const history = player?.player_history ?? [];

  return [...history]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((entry: any) => ({
      team: entry.team ? { id: entry.team.id, name: entry.team.name } : null,
      joined_on: entry.joined_on ?? null,
      left_on: entry.left_on ?? null,
      squad_number: entry.squad_number ?? null,
      is_loan: !!entry.is_loan,
    }))
    .sort((a, b) => {
      const aOngoing = !a.left_on;
      const bOngoing = !b.left_on;
      if (aOngoing !== bOngoing) return aOngoing ? -1 : 1;
      return (b.joined_on ?? '').localeCompare(a.joined_on ?? '');
    });
}

async function fetchPlayersByMatchFromDB(matchId: string): Promise<PlayerWithStats[]> {
  const { data, error } = await supabase
    .from('player_stats')
    .select(`
      *,
      player:players(*, player_history:player_history(*)),
      match:matches(date)
    `)
    .eq('match_id', matchId)
    .order('started', { ascending: false })
    .order('minute_on', { ascending: true });

  if (error) {
    console.error('Error fetching players by match:', error);
    throw error;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((stat: any) => ({
    ...stat.player,
    squad_number: getSquadNumberFromHistory(stat.player, stat.match?.date ? new Date(stat.match.date) : new Date()),
    player_stats: {
      id: stat.id,
      player_id: stat.player_id,
      match_id: stat.match_id,
      team_id: stat.team_id,
      started: stat.started,
      was_substitute: stat.was_substitute,
      was_unused_substitute: stat.was_unused_substitute,
      minute_on: stat.minute_on,
      minute_off: stat.minute_off,
      minutes_played: stat.minutes_played,
      goals: stat.goals,
      assists: stat.assists,
      yellow_cards: stat.yellow_cards,
      red_cards: stat.red_cards,
      clean_sheet: stat.clean_sheet,
      saves: stat.saves,
      shots: stat.shots,
      shots_on_target: stat.shots_on_target,
      passes_completed: stat.passes_completed,
      passes_attempted: stat.passes_attempted,
      tackles: stat.tackles,
      interceptions: stat.interceptions,
      clearances: stat.clearances,
      fouls_committed: stat.fouls_committed,
      fouls_won: stat.fouls_won,
      offsides: stat.offsides,
      player_rating: stat.player_rating,
      player_of_the_match: stat.player_of_the_match,
      created_at: stat.created_at,
    }
  }));
}

export const getPlayersByMatch = createCachedFunction(
  fetchPlayersByMatchFromDB,
  {
    keyParts: ['players-by-match'],
    tags: [CACHE_TAGS.MATCHES, CACHE_TAGS.PLAYERS],
    ttl: 'PLAYER_STATS'
  }
);

async function fetchTeamLineupsByMatchFromDB(matchId: string): Promise<TeamLineup[]> {
  const { data, error } = await supabase
    .from('player_stats')
    .select(`
      *,
      player:players(*, player_history:player_history(*)),
      match:matches(date)
    `)
    .eq('match_id', matchId)
    .order('team_id')
    .order('started', { ascending: false })
    .order('minute_on', { ascending: true });

  if (error) {
    console.error('Error fetching team lineups by match:', error);
    throw error;
  }

  // Group players by team
  const teamGroups = data.reduce((acc: { [key: number]: unknown[] }, stat: unknown) => {
    const statRecord = stat as { team_id: number };
    if (!acc[statRecord.team_id]) {
      acc[statRecord.team_id] = [];
    }
    acc[statRecord.team_id].push(stat);
    return acc;
  }, {});

  return Object.entries(teamGroups).map(([teamId, stats]) => ({
    team_id: parseInt(teamId),
    players: stats.map((stat: unknown) => {
      const statRecord = stat as {
        id: string;
        player_id: string;
        match_id: string;
        team_id: number;
        started: boolean;
        was_substitute: boolean;
        was_unused_substitute: boolean;
        minute_on: number | null;
        minute_off: number | null;
        minutes_played: number;
        goals: number;
        assists: number;
        yellow_cards: number;
        red_cards: number;
        clean_sheet: boolean | null;
        saves: number | null;
        shots: number;
        shots_on_target: number;
        passes_completed: number | null;
        passes_attempted: number | null;
        tackles: number | null;
        interceptions: number | null;
        clearances: number | null;
        fouls_committed: number | null;
        fouls_won: number | null;
        offsides: number | null;
        player_rating: number | null;
        player_of_the_match: boolean;
        created_at: string;
        player: Player & { player_history?: { squad_number: number | null }[] | null };
        match: { date: string } | null;
      };

      return {
        ...statRecord.player,
        squad_number: getSquadNumberFromHistory(
          statRecord.player,
          statRecord.match?.date ? new Date(statRecord.match.date) : new Date()
        ),
        player_stats: {
          id: statRecord.id,
          player_id: statRecord.player_id,
          match_id: statRecord.match_id,
          team_id: statRecord.team_id,
          started: statRecord.started,
          was_substitute: statRecord.was_substitute,
          was_unused_substitute: statRecord.was_unused_substitute,
          minute_on: statRecord.minute_on,
          minute_off: statRecord.minute_off,
          minutes_played: statRecord.minutes_played,
          goals: statRecord.goals,
          assists: statRecord.assists,
          yellow_cards: statRecord.yellow_cards,
          red_cards: statRecord.red_cards,
          clean_sheet: statRecord.clean_sheet,
          saves: statRecord.saves,
          shots: statRecord.shots,
          shots_on_target: statRecord.shots_on_target,
          passes_completed: statRecord.passes_completed,
          passes_attempted: statRecord.passes_attempted,
          tackles: statRecord.tackles,
          interceptions: statRecord.interceptions,
          clearances: statRecord.clearances,
          fouls_committed: statRecord.fouls_committed,
          fouls_won: statRecord.fouls_won,
          offsides: statRecord.offsides,
          player_rating: statRecord.player_rating,
          player_of_the_match: statRecord.player_of_the_match,
          created_at: statRecord.created_at,
        }
      };
    })
  }));
}

export const getTeamLineupsByMatch = createCachedFunction(
  fetchTeamLineupsByMatchFromDB,
  {
    keyParts: ['team-lineups-by-match'],
    tags: [CACHE_TAGS.MATCHES, CACHE_TAGS.PLAYERS],
    ttl: 'PLAYER_STATS'
  }
);

async function fetchPlayerByIdFromDB(playerId: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from('players')
    .select('*, player_history:player_history(*, team:teams(id, name))')
    .eq('id', playerId)
    .single();

  if (error) {
    console.error('Error fetching player by ID:', error);
    return null;
  }

  return {
    ...data,
    squad_number: getSquadNumberFromHistory(data),
    current_club: getCurrentClubFromHistory(data),
    history: getHistoryFromRecord(data),
  };
}

export const getPlayerById = createCachedFunction(
  fetchPlayerByIdFromDB,
  {
    keyParts: ['player-by-id'],
    tags: [CACHE_TAGS.PLAYERS],
    ttl: 'PLAYER_DATA'
  }
);

export interface PlayerMatchAppearance {
  match: Match;
  started: boolean;
  was_substitute: boolean;
  was_unused_substitute: boolean;
  minutes_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  player_rating: number | null;
  player_of_the_match: boolean;
}

async function fetchPlayerMatchHistoryFromDB(playerId: string): Promise<PlayerMatchAppearance[]> {
  const { data, error } = await supabase
    .from('player_stats')
    .select(`
      started,
      was_substitute,
      was_unused_substitute,
      minutes_played,
      goals,
      assists,
      yellow_cards,
      red_cards,
      player_rating,
      player_of_the_match,
      match:matches_with_stadium(
        *,
        home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
        away_team:away_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
        competitions:competition_id(name, icon_svg)
      )
    `)
    .eq('player_id', playerId);

  if (error) {
    console.error('Error fetching player match history:', error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[])
    .filter((row) => row.match)
    .map((row) => ({
      match: row.match,
      started: row.started,
      was_substitute: row.was_substitute,
      was_unused_substitute: row.was_unused_substitute,
      minutes_played: row.minutes_played,
      goals: row.goals,
      assists: row.assists,
      yellow_cards: row.yellow_cards,
      red_cards: row.red_cards,
      player_rating: row.player_rating,
      player_of_the_match: row.player_of_the_match,
    }))
    .sort((a, b) => new Date(b.match.date).getTime() - new Date(a.match.date).getTime());
}

export const getPlayerMatchHistory = createCachedFunction(
  fetchPlayerMatchHistoryFromDB,
  {
    keyParts: ['player-match-history'],
    tags: [CACHE_TAGS.MATCHES, CACHE_TAGS.PLAYERS],
    ttl: 'PLAYER_STATS'
  }
);
