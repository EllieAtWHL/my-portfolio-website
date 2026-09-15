import { supabase } from '@/utils/supabase';
import { createCachedFunction, CACHE_TAGS } from './cache-utils';
import { Match } from './matches';
import { fetchPlayerStatsAggregateForTeam, type PlayerWithStats as TeamPlayerWithStats } from './teams';

// Tottenham Women's team_id - the single source of truth for this fact in
// this file (getSquadNumberFromHistory below compares against it directly;
// call sites that need a string, e.g. fetchPlayerStatsAggregateForTeam's
// teamId param, convert with String()).
const TOTTENHAM_TEAM_ID = 1;

// Shared Supabase select fragment for player_history joined to both of its team
// relations. Needs explicit FK hints (team:teams!<fk_name>) because player_history
// now has two FKs to teams (team_id, on_loan_from_team_id) - PostgREST can't
// disambiguate an embed on "teams" without one.
const PLAYER_HISTORY_WITH_TEAMS_SELECT =
  'player_history:player_history(*, team:teams!player_history_team_id_fkey(id, name), on_loan_from_team:teams!player_history_on_loan_from_team_id_fkey(id, name))';

export interface PlayerHistoryEntry {
  team: { id: number; name: string } | null;
  joined_on: string | null;
  left_on: string | null;
  squad_number: number | null;
  on_loan_from_team: { id: number; name: string } | null;
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
  current_club?: { id: number; name: string; onLoanFrom: { id: number; name: string } | null } | null;
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

// Projects a joined team/on_loan_from_team relation (as returned by Supabase's
// embedded-resource select) down to the {id, name} shape exposed on Player/PlayerHistoryEntry.
function toTeamRef(team: { id: number; name: string } | null | undefined): { id: number; name: string } | null {
  return team ? { id: team.id, name: team.name } : null;
}

// Helper function to find the correct squad number from player_history as of a
// given reference date (the match date for match lineups, or today for a
// player's current squad number) - not always "today", since a squad number
// active at match time may since have changed or lapsed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSquadNumberFromHistory(player: any, referenceDate: Date = new Date()): number | null {
  // Find the correct player_history record for this team
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relevantHistory = player?.player_history?.find((history: any) =>
    history.team_id === TOTTENHAM_TEAM_ID &&
    (!history.joined_on || new Date(history.joined_on) <= referenceDate) &&
    (!history.left_on || new Date(history.left_on) > referenceDate)
  );

  // `|| null` (rather than `??`) means a genuine squad_number of 0 would also
  // resolve to null here, and PlayerTable's squad-number cell has the same
  // `|| '-'` behaviour - known, deliberately left as-is: no Spurs Women
  // player has ever worn 0, and fixing it touches this shared helper's other
  // callers (match lineups, the single-player profile page) beyond what any
  // current ticket covers.
  return relevantHistory?.squad_number || null;
}

// Shared by getCurrentClubFromHistory and getHistoryFromRecord: orders raw player_history
// rows by joined_on descending, breaking ties on created_at. The created_at tiebreak
// matters because Array.sort is only stable relative to input order, and PostgREST does
// not guarantee row order for an embedded relation without an explicit .order() - so two
// rows sharing a joined_on (a same-day transfer, or a data-entry duplicate) would
// otherwise fall back to unordered DB return order, silently reintroducing the same
// DB-order-dependent ambiguity these functions exist to avoid.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function compareByJoinedOnDesc(a: any, b: any): number {
  const joinedDiff = (b.joined_on ?? '').localeCompare(a.joined_on ?? '');
  if (joinedDiff !== 0) return joinedDiff;
  return (b.created_at ?? '').localeCompare(a.created_at ?? '');
}

// Helper function to find a player's current club (any team, not just Tottenham) from
// player_history. A player can have two records open at once - e.g. an outbound loan
// away from Tottenham while the Tottenham contract itself stays open with no left_on.
// Picking the most recently joined open record (rather than an unordered .find())
// resolves this correctly on its own: a loan's joined_on is always later than the
// still-open parent-club record it overlaps, so it naturally sorts first - no separate
// "prefer loan records" rule needed, which would otherwise risk surfacing a stale loan
// row over a genuinely newer non-loan record (e.g. an admin forgetting to close the old
// loan row when the player returns). The chosen record's own on_loan_from_team (if any)
// is what's surfaced via onLoanFrom.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCurrentClubFromHistory(player: any): { id: number; name: string; onLoanFrom: { id: number; name: string } | null } | null {
  const openRecords = (player?.player_history ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((history: any) => !history.left_on || new Date(history.left_on) > new Date())
    .sort(compareByJoinedOnDesc);

  const record = openRecords[0];
  if (!record?.team) return null;

  return {
    id: record.team.id,
    name: record.team.name,
    onLoanFrom: toTeamRef(record.on_loan_from_team),
  };
}

// Helper function to build a player's full club history (all teams, ongoing stint first,
// then most recently joined first, ties broken by created_at) from their raw
// player_history rows. Sorts the raw rows (while created_at is still present) before
// mapping down to PlayerHistoryEntry's public shape, which doesn't expose it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getHistoryFromRecord(player: any): PlayerHistoryEntry[] {
  const history = player?.player_history ?? [];

  return [...history]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => {
      const aOngoing = !a.left_on;
      const bOngoing = !b.left_on;
      if (aOngoing !== bOngoing) return aOngoing ? -1 : 1;
      return compareByJoinedOnDesc(a, b);
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((entry: any) => ({
      team: toTeamRef(entry.team),
      joined_on: entry.joined_on ?? null,
      left_on: entry.left_on ?? null,
      squad_number: entry.squad_number ?? null,
      on_loan_from_team: toTeamRef(entry.on_loan_from_team),
    }));
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
    .select(`*, ${PLAYER_HISTORY_WITH_TEAMS_SELECT}`)
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

// Every player in the players table, not just those with Tottenham history -
// this is a general squad/roster reference, so a player added without ever
// being linked to Tottenham (e.g. in error, or ahead of their history being
// entered) should still show up rather than silently vanish from the index.
// squad_number only resolves for a player currently on the books (reusing
// getSquadNumberFromHistory - a former player shows a dash, not their old
// number, since it may since have been reassigned); career stats come back
// zero for anyone without a Tottenham stint; current_club still resolves via
// their history with any team, reusing the same helper fetchPlayerByIdFromDB uses.
// Unlike the player_stats fetch below, this query has no pagination - fine
// while the whole players table is well under PostgREST's 1000-row page cap
// (192 at last count), but the same silent-truncation bug fetchPlayerStatsAggregateForTeam's
// comment describes fixing could recur here if that ever changes.
async function fetchAllPlayersFromDB(): Promise<TeamPlayerWithStats[]> {
  // Independent reads (the players table and Tottenham's player_stats
  // aggregate), so run them concurrently rather than one after the other.
  const [{ data, error }, statsByPlayer] = await Promise.all([
    supabase
      .from('players')
      .select(`*, ${PLAYER_HISTORY_WITH_TEAMS_SELECT}`),
    fetchPlayerStatsAggregateForTeam(String(TOTTENHAM_TEAM_ID)),
  ]);

  if (error) {
    console.error('Error fetching all players:', error);
    return [];
  }

  const noStats = { appearances: 0, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 };

  return (data || []).map((player) => ({
    ...player,
    squad_number: getSquadNumberFromHistory(player),
    current_club: getCurrentClubFromHistory(player),
    history: getHistoryFromRecord(player),
    ...(statsByPlayer.get(player.id) ?? noStats),
  }));
}

export const getAllPlayers = createCachedFunction(
  fetchAllPlayersFromDB,
  {
    keyParts: ['players', 'all'],
    tags: [CACHE_TAGS.PLAYERS, CACHE_TAGS.TEAMS],
    ttl: 'PLAYER_DATA'
  }
);
