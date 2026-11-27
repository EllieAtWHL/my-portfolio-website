import type { Match } from '@/lib/data/matches';

jest.mock('@/lib/data/matches', () => ({
  getUpcomingMatches: jest.fn(),
  getPreviousMatches: jest.fn(),
  getMatchById: jest.fn(),
  getSeasonMatches: jest.fn(),
}));
jest.mock('@/lib/data/players', () => ({
  getAllPlayers: jest.fn(),
  getPlayerById: jest.fn(),
  getPlayerMatchHistory: jest.fn(),
  getPlayerTotals: jest.fn(),
  getTeamLineupsByMatch: jest.fn(),
}));
jest.mock('@/lib/data/seasons', () => ({
  getAllSeasonStats: jest.fn(),
  getSeasonById: jest.fn(),
  getSeasonReview: jest.fn(),
  getSeasonsWithMatchCounts: jest.fn(),
}));
jest.mock('@/lib/data/teams', () => ({
  getAllTeams: jest.fn(),
  getMatchesForTeam: jest.fn(),
  getTeamById: jest.fn(),
}));
jest.mock('@/lib/data/stadiums', () => ({
  getAllStadiums: jest.fn(),
  getMatchesAtStadium: jest.fn(),
  getStadiumBySlug: jest.fn(),
  getAllStadiumNames: jest.fn(),
}));
jest.mock('@/lib/data/media', () => ({ getMediaByMatch: jest.fn() }));
jest.mock('@/lib/data/news', () => ({ getSpursWomenNews: jest.fn() }));

import * as matches from '@/lib/data/matches';
import * as players from '@/lib/data/players';
import * as seasons from '@/lib/data/seasons';
import * as teams from '@/lib/data/teams';
import * as stadiums from '@/lib/data/stadiums';
import * as media from '@/lib/data/media';
import * as news from '@/lib/data/news';
import { MAX_PAGE_SIZE, ToolInputError, callReadTool, normalise, paginate, rankLeaderboard, readTools, registerReadTools, summariseRecord } from '../read-tools';

// Tool results are loosely-typed JSON for the model; the assertions below are
// what pin their shape down.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolOutput = any;

const MATCH_ID = 'bf4eb036-2ead-447c-9305-0f8b7aad4e81';
const PLAYER_ID = '1e377cb1-24a9-4e10-b11f-fe986fabd051';
const SEASON_ID = 'b94b8778-6dbc-4cc3-b6fc-dc78f9b31eac';

const spurs = { id: 1, name: 'Tottenham Hotspur', short_name: 'Spurs', primary_color: '#fff', secondary_color: '#000', is_tottenham: true };
const arsenal = { id: 4, name: 'Arsenal', short_name: 'Arsenal', primary_color: '#f00', secondary_color: '#fff', is_tottenham: false };

function buildMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: MATCH_ID,
    date: '2026-11-22',
    kickoff_time: '12:00:00',
    home_team: spurs,
    away_team: arsenal,
    spurs_score: 2,
    opponent_score: 1,
    attended: true,
    is_home_match: true,
    is_neutral_venue: false,
    stadium_id: 'stadium-1',
    stadium_display_name: 'Brisbane Road',
    stadium_slug: 'brisbane-road',
    attendance: 1200,
    notes: null,
    competitions: { name: 'Womens Super League', icon_svg: '<svg/>' },
    season_id: SEASON_ID,
    home_possession: 55,
    away_possession: 45,
    home_total_shots: 10,
    away_total_shots: 6,
    home_shots_on_target: 5,
    away_shots_on_target: 2,
    home_corners: 4,
    away_corners: 3,
    ...overrides,
  };
}

const player = {
  id: PLAYER_ID,
  first_name: 'Matilda',
  last_name: 'Vinberg',
  date_of_birth: '2003-03-16',
  nationality: 'Sweden',
  position: 'Forward',
  height_cm: 170,
  weight_kg: null,
  profile_image_url: null,
  squad_number: 13,
  legacy_number: 162,
  current_club: { id: 1, name: 'Tottenham Hotspur', onLoanFrom: null },
  history: [{ team: { id: 1, name: 'Tottenham Hotspur' }, joined_on: '2024-01-02', left_on: null, squad_number: 13, on_loan_from_team: null }],
  created_at: '',
  updated_at: '',
};

function tool(name: string) {
  const found = readTools.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`no tool ${name}`);
  return found;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('tool registry', () => {
  it('only exposes read tools, with unique names', () => {
    const names = readTools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    // Guard for the public endpoint: nothing here may look like a write.
    for (const name of names) {
      expect(name).toMatch(/^(get|list|search)_/);
    }
  });

  it('registers every tool with the server as read-only', () => {
    const registerTool = jest.fn();
    registerReadTools({ registerTool } as never);

    expect(registerTool).toHaveBeenCalledTimes(readTools.length);
    for (const [, config] of registerTool.mock.calls) {
      expect(config.annotations).toEqual({ readOnlyHint: true, openWorldHint: false });
      expect(config.description).toBeTruthy();
    }
  });

  it('wires the registered callback to the tool', async () => {
    const registerTool = jest.fn();
    registerReadTools({ registerTool } as never);
    (seasons.getSeasonsWithMatchCounts as jest.Mock).mockResolvedValue([{ id: SEASON_ID, name: '2025/2026', match_count: 32 }]);

    const [, , callback] = registerTool.mock.calls.find(([name]) => name === 'list_seasons')!;
    const result = await callback({});

    expect(JSON.parse(result.content[0].text)).toEqual([{ id: SEASON_ID, name: '2025/2026', match_count: 32 }]);
  });
});

describe('paginate', () => {
  it('slices and reports whether more pages remain', () => {
    expect(paginate([1, 2, 3, 4, 5], { limit: 2, offset: 0 })).toEqual({ total: 5, offset: 0, limit: 2, has_more: true, items: [1, 2] });
    expect(paginate([1, 2, 3, 4, 5], { limit: 2, offset: 4 })).toEqual({ total: 5, offset: 4, limit: 2, has_more: false, items: [5] });
    expect(paginate([1, 2], { limit: 5, offset: 10 })).toEqual({ total: 2, offset: 10, limit: 5, has_more: false, items: [] });
  });
});

describe('summariseRecord', () => {
  it('counts results and goals, skipping unplayed fixtures', () => {
    const record = summariseRecord([
      buildMatch({ spurs_score: 2, opponent_score: 1 }),
      buildMatch({ spurs_score: 1, opponent_score: 1, spurs_score_aet: 2, opponent_score_aet: 1 }),
      buildMatch({ spurs_score: 3, opponent_score: 3, spurs_score_pens: 3, opponent_score_pens: 4 }),
      buildMatch({ spurs_score: 0, opponent_score: 2 }),
      buildMatch({ spurs_score: null, opponent_score: null }),
    ]);

    expect(record).toEqual({ played: 4, won: 2, drawn: 1, lost: 1, goals_for: 7, goals_against: 7 });
  });
});

describe('match tools', () => {
  it('get_upcoming_matches passes the limit through and summarises each match', async () => {
    (matches.getUpcomingMatches as jest.Mock).mockResolvedValue([buildMatch({ spurs_score: null, opponent_score: null })]);

    const result = (await tool('get_upcoming_matches').run({ limit: 3 })) as Array<Record<string, unknown>>;

    expect(matches.getUpcomingMatches).toHaveBeenCalledWith(3);
    expect(result[0]).toMatchObject({ opponent: 'Arsenal', venue: 'home', competition: 'Womens Super League', result: null });
    // Presentation-only fields are dropped.
    expect(JSON.stringify(result)).not.toContain('icon_svg');
    expect(JSON.stringify(result)).not.toContain('primary_color');
  });

  it('get_previous_matches defaults to 5 and rejects an oversized limit', async () => {
    (matches.getPreviousMatches as jest.Mock).mockResolvedValue([]);

    await tool('get_previous_matches').run({});
    expect(matches.getPreviousMatches).toHaveBeenCalledWith(5);

    await expect(tool('get_previous_matches').run({ limit: 500 })).rejects.toThrow();
  });

  it('get_match combines the match, both line-ups and media', async () => {
    (matches.getMatchById as jest.Mock).mockResolvedValue(buildMatch({ home_team: arsenal, away_team: spurs, is_home_match: false }));
    (players.getTeamLineupsByMatch as jest.Mock).mockResolvedValue([
      { team_id: 1, players: [{ ...player, player_stats: { started: true, captain: true, was_unused_substitute: false, minute_on: null, minute_off: 80, minutes_played: 80, goals: 1, assists: 0, yellow_cards: 0, red_cards: 0, player_of_the_match: true } }] },
    ]);
    (media.getMediaByMatch as jest.Mock).mockResolvedValue([
      { id: 1, match_id: 1, type: 'article', title: 'Report', url: 'https://example.com', thumbnail_url: null, description: null, source: 'She Kicks', date: '2026-11-22', sort_order: 0, created_at: '', caption: null },
    ]);

    const result = (await tool('get_match').run({ match_id: MATCH_ID })) as ToolOutput;

    expect(result).toMatchObject({ opponent: 'Arsenal', venue: 'away', result: 'W', stats: { home_possession: 55 } });
    expect(result.lineups).toEqual([
      { team: 'Tottenham Hotspur', players: [expect.objectContaining({ name: 'Matilda Vinberg', goals: 1, captain: true, player_of_the_match: true })] },
    ]);
    expect(result.media).toEqual([{ type: 'article', title: 'Report', url: 'https://example.com', source: 'She Kicks', date: '2026-11-22' }]);
  });

  it('get_match explains a missing match instead of failing', async () => {
    (matches.getMatchById as jest.Mock).mockResolvedValue(null);
    (players.getTeamLineupsByMatch as jest.Mock).mockResolvedValue([]);
    (media.getMediaByMatch as jest.Mock).mockResolvedValue([]);

    await expect(tool('get_match').run({ match_id: MATCH_ID })).rejects.toBeInstanceOf(ToolInputError);
  });

  it('rejects ids that are not UUIDs before querying', async () => {
    await expect(tool('get_match').run({ match_id: 'nope' })).rejects.toThrow();
    expect(matches.getMatchById).not.toHaveBeenCalled();
  });
});

describe('season tools', () => {
  it('get_season returns the record and matches', async () => {
    (seasons.getSeasonById as jest.Mock).mockResolvedValue({ id: SEASON_ID, name: '2025/2026' });
    (matches.getSeasonMatches as jest.Mock).mockResolvedValue([buildMatch(), buildMatch({ spurs_score: 0, opponent_score: 1 })]);

    const result = (await tool('get_season').run({ season_id: SEASON_ID })) as ToolOutput;

    expect(matches.getSeasonMatches).toHaveBeenCalledWith(SEASON_ID);
    expect(result.record).toMatchObject({ played: 2, won: 1, lost: 1 });
    expect(result.matches).toHaveLength(2);
  });

  it('get_season and get_season_review report unknown seasons', async () => {
    (seasons.getSeasonById as jest.Mock).mockResolvedValue(null);
    (matches.getSeasonMatches as jest.Mock).mockResolvedValue([]);
    (seasons.getSeasonReview as jest.Mock).mockResolvedValue(null);

    await expect(tool('get_season').run({ season_id: SEASON_ID })).rejects.toBeInstanceOf(ToolInputError);
    await expect(tool('get_season_review').run({ season_id: SEASON_ID })).rejects.toBeInstanceOf(ToolInputError);
  });

  it('get_season_review returns the review', async () => {
    (seasons.getSeasonById as jest.Mock).mockResolvedValue({ id: SEASON_ID, name: '2025/2026' });
    (seasons.getSeasonReview as jest.Mock).mockResolvedValue({ season_id: SEASON_ID, title: 'Season Review', content: 'What a season!' });

    await expect(tool('get_season_review').run({ season_id: SEASON_ID })).resolves.toEqual({
      season_id: SEASON_ID, title: 'Season Review', content: 'What a season!', highlights: [],
    });
  });

  it('get_season_review says a valid season has no review yet, rather than calling the id invalid', async () => {
    (seasons.getSeasonById as jest.Mock).mockResolvedValue({ id: SEASON_ID, name: '2026/2027' });
    (seasons.getSeasonReview as jest.Mock).mockResolvedValue(null);

    await expect(tool('get_season_review').run({ season_id: SEASON_ID })).rejects.toThrow(
      'No review has been published for the 2026/2027 season yet.'
    );
  });

  it('get_season_stats renames the owner-attendance figure so it cannot pass for crowd size', async () => {
    (seasons.getAllSeasonStats as jest.Mock).mockResolvedValue([{ seasonId: SEASON_ID, winPercentage: 50, attendancePercentage: 85 }]);

    await expect(tool('get_season_stats').run({})).resolves.toEqual([
      { seasonId: SEASON_ID, winPercentage: 50, percentageOfMatchesSiteOwnerAttended: 85 },
    ]);
  });
});

describe('player tools', () => {
  const squad = [
    { ...player, appearances: 89, goals: 6, assists: 9, yellow_cards: 0, red_cards: 0 },
    { ...player, id: 'p2', first_name: 'Bethany', last_name: 'England', appearances: 50, goals: 30, assists: 5, yellow_cards: 0, red_cards: 0 },
    { ...player, id: 'p3', first_name: 'Eveliina', last_name: 'Summanen', appearances: 70, goals: 4, assists: 6, yellow_cards: 0, red_cards: 0 },
  ];

  it('search_players matches first, last or full name, case-insensitively', async () => {
    (players.getAllPlayers as jest.Mock).mockResolvedValue(squad);

    const byLast = (await tool('search_players').run({ query: 'VINBERG' })) as ToolOutput;
    expect(byLast.items.map((p: { name: string }) => p.name)).toEqual(['Matilda Vinberg']);
    expect(byLast.items[0]).toMatchObject({ tottenham_appearances: 89, tottenham_goals: 6 });

    const byFull = (await tool('search_players').run({ query: 'bethany england' })) as ToolOutput;
    expect(byFull.total).toBe(1);
  });

  it('search_players matches regardless of accents', async () => {
    (players.getAllPlayers as jest.Mock).mockResolvedValue([{ ...squad[0], first_name: 'Zoë', last_name: 'Ness' }]);

    const result = (await tool('search_players').run({ query: 'zoe' })) as ToolOutput;
    expect(result.total).toBe(1);
  });

  it('search_players matches letters NFD does not decompose, like o-slash', async () => {
    (players.getAllPlayers as jest.Mock).mockResolvedValue([{ ...squad[0], first_name: 'Bjørn', last_name: 'Ærø' }]);

    expect(((await tool('search_players').run({ query: 'bjorn' })) as ToolOutput).total).toBe(1);
    expect(((await tool('search_players').run({ query: 'aero' })) as ToolOutput).total).toBe(1);
  });

  it('search_players enforces a minimum query and the page-size cap', async () => {
    await expect(tool('search_players').run({ query: 'a' })).rejects.toThrow();
    await expect(tool('search_players').run({ query: 'ab', limit: MAX_PAGE_SIZE + 1 })).rejects.toThrow();
  });

  it('get_player returns the profile and club history', async () => {
    (players.getPlayerById as jest.Mock).mockResolvedValue(player);

    await expect(tool('get_player').run({ player_id: PLAYER_ID })).resolves.toMatchObject({
      name: 'Matilda Vinberg',
      current_club: 'Tottenham Hotspur',
      club_history: [{ team: 'Tottenham Hotspur', joined_on: '2024-01-02', left_on: null, squad_number: 13, on_loan_from: null }],
    });
  });

  it('get_player reports an unknown player', async () => {
    (players.getPlayerById as jest.Mock).mockResolvedValue(null);

    await expect(tool('get_player').run({ player_id: PLAYER_ID })).rejects.toBeInstanceOf(ToolInputError);
  });

  it('get_player_history pages through appearances', async () => {
    const appearance = { match: buildMatch(), started: true, was_substitute: false, was_unused_substitute: false, minutes_played: 90, goals: 1, assists: 0, yellow_cards: 0, red_cards: 0, player_rating: null, player_of_the_match: false };
    (players.getPlayerById as jest.Mock).mockResolvedValue(player);
    (players.getPlayerMatchHistory as jest.Mock).mockResolvedValue([appearance, appearance, appearance]);

    const result = (await tool('get_player_history').run({ player_id: PLAYER_ID, limit: 2 })) as ToolOutput;

    expect(result).toMatchObject({ total: 3, has_more: true });
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({ goals: 1, minutes_played: 90, match: { opponent: 'Arsenal', result: 'W', attended_by_site_owner: true } });
  });

  it('get_player_history reports an unknown player rather than "no appearances"', async () => {
    (players.getPlayerById as jest.Mock).mockResolvedValue(null);
    (players.getPlayerMatchHistory as jest.Mock).mockResolvedValue([]);

    await expect(tool('get_player_history').run({ player_id: PLAYER_ID })).rejects.toBeInstanceOf(ToolInputError);
  });
});

describe('normalise', () => {
  it('folds case, accents and letters NFD keeps whole', () => {
    expect(normalise('Bjørn Ærø ŁUKASZ Zoë Straße')).toBe('bjorn aero lukasz zoe strasse');
  });
});

describe('get_leaderboard', () => {
  // Names from the real data set that prompted this tool: a name-fragment
  // sweep of search_players missed Olivia Holdt, who is second all-time.
  const squad = [
    { ...player, id: 'england', first_name: 'Bethany', last_name: 'England' },
    { ...player, id: 'holdt', first_name: 'Olivia', last_name: 'Holdt' },
    { ...player, id: 'thomas', first_name: 'Martha', last_name: 'Thomas' },
    { ...player, id: 'keeper', first_name: 'Becky', last_name: 'Spencer' },
  ];
  const careerTotals = [
    { player_id: 'england', appearances: 93, goals: 41, assists: 10, yellow_cards: 3, red_cards: 0 },
    { player_id: 'holdt', appearances: 58, goals: 20, assists: 5, yellow_cards: 1, red_cards: 0 },
    { player_id: 'thomas', appearances: 72, goals: 17, assists: 4, yellow_cards: 2, red_cards: 1 },
    { player_id: 'keeper', appearances: 80, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 },
  ];

  it('ranks every player by career goals without searching by name', async () => {
    (players.getAllPlayers as jest.Mock).mockResolvedValue(squad);
    (players.getPlayerTotals as jest.Mock).mockResolvedValue(careerTotals);

    const result = (await tool('get_leaderboard').run({})) as ToolOutput;

    expect(players.getPlayerTotals).toHaveBeenCalledWith(undefined);
    expect(seasons.getSeasonById).not.toHaveBeenCalled();
    expect(result.stat).toBe('goals');
    expect(result.scope).toBe('All seasons on record');
    expect(result.ranking.map((r: { name: string; rank: number; value: number }) => [r.rank, r.name, r.value])).toEqual([
      [1, 'Bethany England', 41],
      [2, 'Olivia Holdt', 20],
      [3, 'Martha Thomas', 17],
    ]);
    // Players on zero are left out rather than padding the table.
    expect(result.ranking.find((r: { name: string }) => r.name === 'Becky Spencer')).toBeUndefined();
    expect(result.tied_players_omitted).toBeUndefined();
  });

  it('ranks by another stat and respects the limit', async () => {
    (players.getAllPlayers as jest.Mock).mockResolvedValue(squad);
    (players.getPlayerTotals as jest.Mock).mockResolvedValue(careerTotals);

    const result = (await tool('get_leaderboard').run({ stat: 'appearances', limit: 2 })) as ToolOutput;

    expect(result.ranking.map((r: { name: string }) => r.name)).toEqual(['Bethany England', 'Becky Spencer']);
  });

  it("filters to one season using that season's totals", async () => {
    (players.getAllPlayers as jest.Mock).mockResolvedValue(squad);
    (seasons.getSeasonById as jest.Mock).mockResolvedValue({ id: SEASON_ID, name: '2025/2026' });
    (players.getPlayerTotals as jest.Mock).mockResolvedValue([
      { player_id: 'thomas', appearances: 30, goals: 9, assists: 2, yellow_cards: 0, red_cards: 0 },
      { player_id: 'holdt', appearances: 25, goals: 6, assists: 3, yellow_cards: 0, red_cards: 0 },
    ]);

    const result = (await tool('get_leaderboard').run({ season_id: SEASON_ID })) as ToolOutput;

    expect(players.getPlayerTotals).toHaveBeenCalledWith(SEASON_ID);
    expect(result.scope).toBe('2025/2026');
    expect(result.ranking).toEqual([
      { rank: 1, player_id: 'thomas', name: 'Martha Thomas', position: 'Forward', value: 9, appearances: 30 },
      { rank: 2, player_id: 'holdt', name: 'Olivia Holdt', position: 'Forward', value: 6, appearances: 25 },
    ]);
  });

  it('reports an unknown season', async () => {
    (players.getAllPlayers as jest.Mock).mockResolvedValue(squad);
    (seasons.getSeasonById as jest.Mock).mockResolvedValue(null);
    (players.getPlayerTotals as jest.Mock).mockResolvedValue([]);

    await expect(tool('get_leaderboard').run({ season_id: SEASON_ID })).rejects.toBeInstanceOf(ToolInputError);
  });

  it('fails loudly when the totals fetch fails, rather than returning an empty board', async () => {
    (players.getAllPlayers as jest.Mock).mockResolvedValue(squad);
    (players.getPlayerTotals as jest.Mock).mockRejectedValue(new Error('Failed to fetch player totals: timeout'));

    await expect(tool('get_leaderboard').run({})).rejects.toThrow('Failed to fetch player totals');
  });

  it('fails loudly when player names come back empty next to real totals (a swallowed fetch error)', async () => {
    (players.getAllPlayers as jest.Mock).mockResolvedValue([]);
    (players.getPlayerTotals as jest.Mock).mockResolvedValue(careerTotals);

    const result = await callReadTool(tool('get_leaderboard'), {});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).not.toContain('Unknown player');
  });

  it('rejects an unknown stat and an oversized limit', async () => {
    await expect(tool('get_leaderboard').run({ stat: 'shots' })).rejects.toThrow();
    await expect(tool('get_leaderboard').run({ limit: MAX_PAGE_SIZE + 1 })).rejects.toThrow();
  });
});

describe('rankLeaderboard', () => {
  const byId = new Map([
    ['a', { first_name: 'Amy', last_name: 'A', position: null }],
    ['b', { first_name: 'Bea', last_name: 'B', position: null }],
    ['c', { first_name: 'Cat', last_name: 'C', position: null }],
    ['d', { first_name: 'Dee', last_name: 'D', position: null }],
  ]);

  it('gives tied players the same rank and skips the next places', () => {
    const { ranking } = rankLeaderboard(
      [
        { player_id: 'c', appearances: 1, value: 5 },
        { player_id: 'a', appearances: 1, value: 7 },
        { player_id: 'b', appearances: 1, value: 5 },
        { player_id: 'd', appearances: 1, value: 3 },
      ],
      byId,
      10
    );

    expect(ranking.map((r) => [r.rank, r.name])).toEqual([[1, 'Amy A'], [2, 'Bea B'], [2, 'Cat C'], [4, 'Dee D']]);
  });

  it('keeps the whole tie at the cut-off rather than dropping part of it', () => {
    const { ranking } = rankLeaderboard(
      [
        { player_id: 'a', appearances: 1, value: 7 },
        { player_id: 'b', appearances: 1, value: 5 },
        { player_id: 'c', appearances: 1, value: 5 },
        { player_id: 'd', appearances: 1, value: 3 },
      ],
      byId,
      2
    );

    expect(ranking.map((r) => r.name)).toEqual(['Amy A', 'Bea B', 'Cat C']);
  });

  it('copes with ties after the cut-off (regression: real data has many players level on 1 goal)', () => {
    const { ranking } = rankLeaderboard(
      [
        { player_id: 'a', appearances: 1, value: 7 },
        { player_id: 'b', appearances: 1, value: 5 },
        { player_id: 'c', appearances: 1, value: 1 },
        { player_id: 'd', appearances: 1, value: 1 },
      ],
      byId,
      2
    );

    expect(ranking.map((r) => [r.rank, r.name])).toEqual([[1, 'Amy A'], [2, 'Bea B']]);
  });

  it('caps a huge tie at MAX_PAGE_SIZE rows and reports how many were left off', () => {
    const totals = Array.from({ length: MAX_PAGE_SIZE + 30 }, (_, i) => ({ player_id: `p${i}`, appearances: 1, value: 1 }));

    const { ranking, tied_players_omitted } = rankLeaderboard(totals, new Map(), 1);

    expect(ranking).toHaveLength(MAX_PAGE_SIZE);
    expect(ranking.every((r) => r.rank === 1)).toBe(true);
    expect(tied_players_omitted).toBe(30);
  });

  it('labels a player missing from the players table instead of dropping their total', () => {
    expect(rankLeaderboard([{ player_id: 'zzz', appearances: 1, value: 2 }], byId, 5).ranking[0].name).toBe('Unknown player');
  });
});

describe('team and stadium tools', () => {
  it('search_teams matches name or short name', async () => {
    (teams.getAllTeams as jest.Mock).mockResolvedValue([spurs, arsenal]);

    const result = (await tool('search_teams').run({ query: 'arse' })) as ToolOutput;
    expect(result.items).toEqual([{ id: 4, name: 'Arsenal', short_name: 'Arsenal', is_tottenham: false }]);
  });

  it('get_team returns the head-to-head record', async () => {
    (teams.getTeamById as jest.Mock).mockResolvedValue(arsenal);
    (teams.getMatchesForTeam as jest.Mock).mockResolvedValue([buildMatch(), buildMatch({ spurs_score: 0, opponent_score: 3 })]);

    const result = (await tool('get_team').run({ team_id: 4 })) as ToolOutput;

    expect(teams.getMatchesForTeam).toHaveBeenCalledWith('4');
    expect(result.head_to_head).toEqual({ played: 2, won: 1, drawn: 0, lost: 1, goals_for: 2, goals_against: 4 });
  });

  it('get_team reports an unknown team', async () => {
    (teams.getTeamById as jest.Mock).mockResolvedValue(null);
    (teams.getMatchesForTeam as jest.Mock).mockResolvedValue([]);

    await expect(tool('get_team').run({ team_id: 999 })).rejects.toBeInstanceOf(ToolInputError);
  });

  it('get_team on Tottenham returns an all-time record, not a head-to-head with itself', async () => {
    (teams.getTeamById as jest.Mock).mockResolvedValue(spurs);
    (teams.getMatchesForTeam as jest.Mock).mockResolvedValue([buildMatch()]);

    const result = (await tool('get_team').run({ team_id: 1 })) as ToolOutput;

    expect(result.head_to_head).toBeUndefined();
    expect(result.all_time_record).toMatchObject({ played: 1, won: 1 });
  });

  it('get_matches_v_team pages the matches', async () => {
    (teams.getTeamById as jest.Mock).mockResolvedValue(arsenal);
    (teams.getMatchesForTeam as jest.Mock).mockResolvedValue([buildMatch(), buildMatch(), buildMatch()]);

    const result = (await tool('get_matches_v_team').run({ team_id: 4, limit: 1, offset: 2 })) as ToolOutput;
    expect(result).toMatchObject({ total: 3, offset: 2, has_more: false });
    expect(result.items).toHaveLength(1);
  });

  it('get_matches_v_team reports an unknown team rather than "never played"', async () => {
    (teams.getTeamById as jest.Mock).mockResolvedValue(null);
    (teams.getMatchesForTeam as jest.Mock).mockResolvedValue([]);

    await expect(tool('get_matches_v_team').run({ team_id: 999 })).rejects.toBeInstanceOf(ToolInputError);
  });

  const ground = {
    id: 's1', name: 'Brisbane Road', slug: 'brisbane-road', city: 'London', country: 'England', capacity: 9271,
    opened_date: null, address_line_1: null, postcode: null, latitude: null, longitude: null, home_team_id: 1,
    spurs_women: true, wikidata_qid: null, home_team: spurs,
  };

  it('search_stadiums matches name or city and leaves out the unjoined home team', async () => {
    (stadiums.getAllStadiums as jest.Mock).mockResolvedValue([{ ...ground, home_team: undefined }]);
    (stadiums.getAllStadiumNames as jest.Mock).mockResolvedValue({});

    const result = (await tool('search_stadiums').run({ query: 'london' })) as ToolOutput;
    expect(result.items).toEqual([{ slug: 'brisbane-road', name: 'Brisbane Road', city: 'London', country: 'England', capacity: 9271, other_names: [] }]);
  });

  it('search_stadiums finds a ground by the sponsored name matches report it under', async () => {
    (stadiums.getAllStadiums as jest.Mock).mockResolvedValue([ground]);
    (stadiums.getAllStadiumNames as jest.Mock).mockResolvedValue({
      s1: [
        { id: 'n1', stadium_id: 's1', name: 'The BetWright Stadium', valid_from: '2024-07-01', valid_to: null },
        { id: 'n2', stadium_id: 's1', name: 'Brisbane Road', valid_from: null, valid_to: '2024-06-30' },
      ],
    });

    const result = (await tool('search_stadiums').run({ query: 'betwright' })) as ToolOutput;

    expect(result.items).toEqual([expect.objectContaining({ slug: 'brisbane-road', other_names: ['The BetWright Stadium'] })]);
  });

  it('get_stadium returns the ground and the record there', async () => {
    (stadiums.getStadiumBySlug as jest.Mock).mockResolvedValue(ground);
    (stadiums.getMatchesAtStadium as jest.Mock).mockResolvedValue([buildMatch()]);

    await expect(tool('get_stadium').run({ slug: 'brisbane-road' })).resolves.toMatchObject({
      home_team: 'Tottenham Hotspur',
      record: { played: 1, won: 1 },
    });
  });

  it('get_stadium reports an unknown ground', async () => {
    (stadiums.getStadiumBySlug as jest.Mock).mockResolvedValue(null);
    (stadiums.getMatchesAtStadium as jest.Mock).mockResolvedValue([]);

    await expect(tool('get_stadium').run({ slug: 'nowhere' })).rejects.toBeInstanceOf(ToolInputError);
  });

  it('get_matches_at_stadium pages the matches', async () => {
    (stadiums.getStadiumBySlug as jest.Mock).mockResolvedValue(ground);
    (stadiums.getMatchesAtStadium as jest.Mock).mockResolvedValue([buildMatch(), buildMatch()]);

    const result = (await tool('get_matches_at_stadium').run({ slug: 'brisbane-road', limit: 1 })) as ToolOutput;
    expect(result).toMatchObject({ total: 2, has_more: true });
  });

  it('get_matches_at_stadium reports a mistyped slug rather than "never played there"', async () => {
    (stadiums.getStadiumBySlug as jest.Mock).mockResolvedValue(null);
    (stadiums.getMatchesAtStadium as jest.Mock).mockResolvedValue([]);

    await expect(tool('get_matches_at_stadium').run({ slug: 'brisbane-rd' })).rejects.toBeInstanceOf(ToolInputError);
  });
});

describe('get_news', () => {
  it('returns trimmed headlines up to the limit', async () => {
    (news.getSpursWomenNews as jest.Mock).mockResolvedValue([
      { title: 'A', link: 'https://a', pubDate: 'x', isoDate: '2026-11-22T00:00:00Z', content: '', contentSnippet: 'y'.repeat(1000), guid: 'a', source: 'She Kicks' },
      { title: 'B', link: 'https://b', pubDate: 'Sun, 22 Nov 2026', isoDate: '', content: '', contentSnippet: '', guid: 'b' },
    ]);

    const result = (await tool('get_news').run({ limit: 2 })) as ToolOutput[];

    expect(result[0]).toMatchObject({ title: 'A', date: '2026-11-22T00:00:00Z', source: 'She Kicks' });
    expect(result[0].snippet).toHaveLength(300);
    expect(result[1]).toMatchObject({ date: 'Sun, 22 Nov 2026', source: null });
  });
});

describe('callReadTool', () => {
  it('wraps the data as JSON text content', async () => {
    (seasons.getAllSeasonStats as jest.Mock).mockResolvedValue([{ seasonId: SEASON_ID }]);

    const result = await callReadTool(tool('get_season_stats'), {});

    expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify([{ seasonId: SEASON_ID }]) }] });
  });

  it('explains not-found and invalid input to the model', async () => {
    (players.getPlayerById as jest.Mock).mockResolvedValue(null);

    const notFound = await callReadTool(tool('get_player'), { player_id: PLAYER_ID });
    expect(notFound.isError).toBe(true);
    expect(notFound.content[0].text).toContain('No player found');

    const invalid = await callReadTool(tool('get_player'), { player_id: 'nope' });
    expect(invalid.isError).toBe(true);
    expect(invalid.content[0].text).toMatch(/^Invalid input:/);
  });

  it('hides unexpected server errors from the client but logs them', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    (seasons.getAllSeasonStats as jest.Mock).mockRejectedValue(new Error('relation "secret_table" does not exist'));

    const result = await callReadTool(tool('get_season_stats'), {});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).not.toContain('secret_table');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
