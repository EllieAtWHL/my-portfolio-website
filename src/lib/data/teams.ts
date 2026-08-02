import { supabase } from '@/utils/supabase';
import { createCachedFunction, CACHE_TAGS, CACHE_TTL } from './cache-utils';
import { Match } from './matches';
import { Team } from './stadiums';
import { Player } from './players';
import { fetchAllFromDB, fetchByIdFromDB, fetchWithMatchCountFromDB } from './generic-fetchers';

export interface TeamWithMatchCount extends Team {
  match_count?: number;
}

export interface PlayerWithStats extends Player {
  appearances: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
}

export interface TeamPlayers {
  current: PlayerWithStats[];
  former: PlayerWithStats[];
}

// Raw database fetch functions
async function fetchAllTeamsFromDB(): Promise<Team[]> {
  return fetchAllFromDB<Team>('teams', 'name');
}

async function fetchTeamsWithMatchCountsFromDB(): Promise<TeamWithMatchCount[]> {
  return fetchWithMatchCountFromDB<Team>('teams', 'matches', 'home_team_id', 'away_team_id', 'name');
}

async function fetchTeamByIdFromDB(teamId: string): Promise<Team | null> {
  return fetchByIdFromDB<Team>('teams', teamId);
}

async function fetchMatchesForTeamFromDB(teamId: string): Promise<Match[]> {
  // Teams use integer IDs; validate before interpolating into the .or() filter string,
  // since PostgREST's .or() syntax (unlike .eq()) has no parameterized-value form.
  const numericTeamId = Number(teamId);
  if (!Number.isInteger(numericTeamId)) {
    console.error('Invalid teamId passed to fetchMatchesForTeamFromDB:', teamId);
    return [];
  }

  const { data, error } = await supabase
    .from('matches_with_stadium')
    .select(`
      *,
      home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
      away_team:away_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
      competitions:competition_id(name, icon_svg)
    `)
    .or(`home_team_id.eq.${numericTeamId},away_team_id.eq.${numericTeamId}`)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching matches for team:', error);
    return [];
  }

  return data || [];
}

async function fetchPlayersForTeamFromDB(teamId: string): Promise<TeamPlayers> {
  // Fetch player_history records for this team
  const { data: playerHistory, error: historyError } = await supabase
    .from('player_history')
    .select(`
      *,
      player:players(*)
    `)
    .eq('team_id', teamId);

  if (historyError) {
    console.error('Error fetching player history for team:', historyError);
    return { current: [], former: [] };
  }

  // Fetch player_stats for all matches to aggregate stats
  const { data: playerStats, error: statsError } = await supabase
    .from('player_stats')
    .select('*')
    .eq('team_id', teamId);

  if (statsError) {
    console.error('Error fetching player stats for team:', statsError);
  }

  // Aggregate stats by player
  const statsByPlayer = new Map<string, { appearances: number; goals: number; assists: number; yellow_cards: number; red_cards: number }>();
  
  playerStats?.forEach((stat: { player_id: string; goals: number | null; assists: number | null; yellow_cards: number | null; red_cards: number | null }) => {
    const playerId = stat.player_id;
    if (!statsByPlayer.has(playerId)) {
      statsByPlayer.set(playerId, { appearances: 0, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 });
    }
    const stats = statsByPlayer.get(playerId)!;
    stats.appearances++;
    stats.goals += stat.goals || 0;
    stats.assists += stat.assists || 0;
    stats.yellow_cards += stat.yellow_cards || 0;
    stats.red_cards += stat.red_cards || 0;
  });

  // Separate into current and former players with stats
  const currentPlayers: PlayerWithStats[] = [];
  const formerPlayers: PlayerWithStats[] = [];

  playerHistory?.forEach((record: { player: Player | null; left_on: string | null; squad_number: number | null }) => {
    const player = record.player;
    if (!player) return;

    // Check if player is currently on the team (no left_on or left_on is in the future)
    const isCurrent = !record.left_on || new Date(record.left_on) > new Date();
    
    const playerStats = statsByPlayer.get(player.id) || { appearances: 0, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 };
    const playerWithStats: PlayerWithStats = {
      ...player,
      squad_number: record.squad_number,
      ...playerStats
    };
    
    if (isCurrent) {
      // Avoid duplicates
      if (!currentPlayers.find((p) => p.id === player.id)) {
        currentPlayers.push(playerWithStats);
      }
    } else {
      // Avoid duplicates
      if (!formerPlayers.find((p) => p.id === player.id)) {
        formerPlayers.push(playerWithStats);
      }
    }
  });

  // Sort by last name
  currentPlayers.sort((a, b) => a.last_name.localeCompare(b.last_name));
  formerPlayers.sort((a, b) => a.last_name.localeCompare(b.last_name));

  return { current: currentPlayers, former: formerPlayers };
}

// Cached functions for team data
export const getAllTeams = createCachedFunction(
  fetchAllTeamsFromDB,
  {
    keyParts: ['teams', 'all'],
    tags: [CACHE_TAGS.TEAMS],
    revalidate: CACHE_TTL.TEAM_DATA,
  }
);

export const getTeamsWithMatchCounts = createCachedFunction(
  fetchTeamsWithMatchCountsFromDB,
  {
    keyParts: ['teams', 'with-counts'],
    tags: [CACHE_TAGS.TEAMS],
    revalidate: CACHE_TTL.TEAM_DATA,
  }
);

export const getTeamById = createCachedFunction(
  fetchTeamByIdFromDB,
  {
    keyParts: ['team', 'by-id'],
    tags: [CACHE_TAGS.TEAMS],
    revalidate: CACHE_TTL.TEAM_DATA,
  }
);

export const getMatchesForTeam = createCachedFunction(
  fetchMatchesForTeamFromDB,
  {
    keyParts: ['matches', 'for-team'],
    tags: [CACHE_TAGS.MATCHES],
    revalidate: CACHE_TTL.CURRENT_SEASON_MATCHES,
  }
);

export const getPlayersForTeam = createCachedFunction(
  fetchPlayersForTeamFromDB,
  {
    keyParts: ['players', 'for-team'],
    tags: [CACHE_TAGS.PLAYERS],
    revalidate: CACHE_TTL.PLAYER_DATA,
  }
);
