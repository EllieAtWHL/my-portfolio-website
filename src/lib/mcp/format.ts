// Compact, model-friendly projections of the data layer's types for the MCP
// tools (WEB-249). The site's fetchers return everything a page needs to
// render - team colours, competition SVG icons, every player_stats column -
// which is noise to Claude and costs tokens on every call. These keep the
// facts and drop the presentation. Pure functions, so they're unit tested
// directly rather than through the MCP transport.
import type { Match } from '@/lib/data/matches';
import type { Player, PlayerWithStats as MatchPlayer } from '@/lib/data/players';
import type { PlayerWithStats as SquadPlayer } from '@/lib/data/teams';
import type { Media } from '@/lib/data/media';
import type { Stadium, Team } from '@/lib/data/stadiums';
import { getMatchResult, getShootoutWinner } from '@/lib/utils/match-result';

function teamName(team: { name: string } | null | undefined): string | null {
  return team?.name ?? null;
}

export function summariseMatch(match: Match) {
  const opponent = match.home_team?.is_tottenham ? match.away_team : match.home_team;

  return {
    id: match.id,
    date: match.date,
    kickoff_time: match.kickoff_time,
    home_team: teamName(match.home_team),
    away_team: teamName(match.away_team),
    opponent: teamName(opponent),
    venue: match.is_neutral_venue ? 'neutral' : match.is_home_match ? 'home' : 'away',
    competition: match.competitions?.name ?? null,
    stadium: match.stadium_display_name,
    stadium_slug: match.stadium_slug,
    spurs_score: match.spurs_score ?? null,
    opponent_score: match.opponent_score ?? null,
    spurs_score_aet: match.spurs_score_aet ?? null,
    opponent_score_aet: match.opponent_score_aet ?? null,
    spurs_score_pens: match.spurs_score_pens ?? null,
    opponent_score_pens: match.opponent_score_pens ?? null,
    // Per football record-keeping: extra time counts, a shootout doesn't (a
    // match decided on penalties is a 'D', with the shootout winner alongside).
    result: getMatchResult(match),
    shootout_winner: getShootoutWinner(match),
    attendance: match.attendance,
    // Whether the site owner was at the match in person - not crowd size
    // (that is attendance), named so a model can't confuse the two.
    attended_by_site_owner: match.attended,
    season_id: match.season_id,
  };
}

// The single-match tool adds the stats and notes a list doesn't need.
export function describeMatch(match: Match) {
  return {
    ...summariseMatch(match),
    notes: match.notes,
    stats: {
      home_possession: match.home_possession,
      away_possession: match.away_possession,
      home_total_shots: match.home_total_shots,
      away_total_shots: match.away_total_shots,
      home_shots_on_target: match.home_shots_on_target,
      away_shots_on_target: match.away_shots_on_target,
      home_corners: match.home_corners,
      away_corners: match.away_corners,
    },
  };
}

export function playerName(player: Pick<Player, 'first_name' | 'last_name'>): string {
  return [player.first_name, player.last_name].filter(Boolean).join(' ');
}

export function summarisePlayer(player: Player) {
  return {
    id: player.id,
    name: playerName(player),
    position: player.position,
    nationality: player.nationality,
    squad_number: player.squad_number,
    current_club: player.current_club ? player.current_club.name : null,
    on_loan_from: player.current_club?.onLoanFrom?.name ?? null,
  };
}

export function describePlayer(player: Player) {
  return {
    ...summarisePlayer(player),
    date_of_birth: player.date_of_birth,
    height_cm: player.height_cm,
    legacy_number: player.legacy_number,
    club_history: (player.history ?? []).map((entry) => ({
      team: entry.team?.name ?? null,
      joined_on: entry.joined_on,
      left_on: entry.left_on,
      squad_number: entry.squad_number,
      on_loan_from: entry.on_loan_from_team?.name ?? null,
    })),
  };
}

// A squad-list player carries career Tottenham totals alongside the profile.
export function summariseSquadPlayer(player: SquadPlayer) {
  return {
    ...summarisePlayer(player),
    tottenham_appearances: player.appearances,
    tottenham_goals: player.goals,
    tottenham_assists: player.assists,
  };
}

export function summariseLineupPlayer(player: MatchPlayer) {
  const stats = player.player_stats;
  return {
    id: player.id,
    name: playerName(player),
    position: player.position,
    squad_number: player.squad_number,
    started: stats?.started ?? null,
    captain: stats?.captain ?? false,
    unused_substitute: stats?.was_unused_substitute ?? null,
    minute_on: stats?.minute_on ?? null,
    minute_off: stats?.minute_off ?? null,
    minutes_played: stats?.minutes_played ?? null,
    goals: stats?.goals ?? null,
    assists: stats?.assists ?? null,
    yellow_cards: stats?.yellow_cards ?? null,
    red_cards: stats?.red_cards ?? null,
    player_of_the_match: stats?.player_of_the_match ?? false,
  };
}

export function summariseMedia(media: Media) {
  return {
    type: media.type,
    title: media.title,
    url: media.url,
    source: media.source,
    date: media.date,
  };
}

export function summariseTeam(team: Team) {
  return {
    id: team.id,
    name: team.name,
    short_name: team.short_name,
    is_tottenham: team.is_tottenham,
  };
}

export function summariseStadium(stadium: Stadium) {
  return {
    slug: stadium.slug,
    name: stadium.name,
    city: stadium.city,
    country: stadium.country,
    capacity: stadium.capacity,
  };
}

// Only the single-stadium fetcher joins home_team (getAllStadiums doesn't), so
// it's added here rather than in summariseStadium - where it would read as a
// misleading null on every search result.
export function describeStadium(stadium: Stadium) {
  return {
    ...summariseStadium(stadium),
    home_team: stadium.home_team?.name ?? null,
  };
}
