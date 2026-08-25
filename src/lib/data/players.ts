import { supabase } from '@/utils/supabase';
import { createCachedFunction, CACHE_TAGS } from './cache-utils';

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

// Helper function to find the correct squad number from player_history
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSquadNumberFromHistory(player: any): number | null {
  // Find the correct player_history record for this team (team_id = 1 for Tottenham)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relevantHistory = player?.player_history?.find((history: any) =>
    history.team_id === 1 &&
    (!history.left_on || new Date(history.left_on) > new Date())
  );

  return relevantHistory?.squad_number || null;
}

async function fetchPlayersByMatchFromDB(matchId: string): Promise<PlayerWithStats[]> {
  const { data, error } = await supabase
    .from('player_stats')
    .select(`
      *,
      player:players(*)
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
    squad_number: getSquadNumberFromHistory(stat.player),
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
      player:players(*, player_history:player_history(*))
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
      };
      
      return {
        ...statRecord.player,
        squad_number: getSquadNumberFromHistory(statRecord.player),
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
    .select('*')
    .eq('id', playerId)
    .single();

  if (error) {
    console.error('Error fetching player by ID:', error);
    return null;
  }

  return data;
}

export const getPlayerById = createCachedFunction(
  fetchPlayerByIdFromDB,
  {
    keyParts: ['player-by-id'],
    tags: [CACHE_TAGS.PLAYERS],
    ttl: 'PLAYER_DATA'
  }
);
