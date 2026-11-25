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
import { MAX_PAGE_SIZE, ToolInputError, callReadTool, paginate, readTools, registerReadTools, summariseRecord } from '../read-tools';

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
    (seasons.getSeasonReview as jest.Mock).mockResolvedValue({ season_id: SEASON_ID, title: 'Season Review', content: 'What a season!' });

    await expect(tool('get_season_review').run({ season_id: SEASON_ID })).resolves.toEqual({
      season_id: SEASON_ID, title: 'Season Review', content: 'What a season!', highlights: [],
    });
  });

  it('get_season_stats passes the per-season stats through', async () => {
    (seasons.getAllSeasonStats as jest.Mock).mockResolvedValue([{ seasonId: SEASON_ID, winPercentage: 50 }]);

    await expect(tool('get_season_stats').run({})).resolves.toEqual([{ seasonId: SEASON_ID, winPercentage: 50 }]);
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
    (players.getPlayerMatchHistory as jest.Mock).mockResolvedValue([appearance, appearance, appearance]);

    const result = (await tool('get_player_history').run({ player_id: PLAYER_ID, limit: 2 })) as ToolOutput;

    expect(result).toMatchObject({ total: 3, has_more: true });
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({ goals: 1, minutes_played: 90, match: { opponent: 'Arsenal', result: 'W' } });
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

  it('get_matches_v_team pages the matches', async () => {
    (teams.getMatchesForTeam as jest.Mock).mockResolvedValue([buildMatch(), buildMatch(), buildMatch()]);

    const result = (await tool('get_matches_v_team').run({ team_id: 4, limit: 1, offset: 2 })) as ToolOutput;
    expect(result).toMatchObject({ total: 3, offset: 2, has_more: false });
    expect(result.items).toHaveLength(1);
  });

  const ground = {
    id: 's1', name: 'Brisbane Road', slug: 'brisbane-road', city: 'London', country: 'England', capacity: 9271,
    opened_date: null, address_line_1: null, postcode: null, latitude: null, longitude: null, home_team_id: 1,
    spurs_women: true, wikidata_qid: null, home_team: spurs,
  };

  it('search_stadiums matches name or city and leaves out the unjoined home team', async () => {
    (stadiums.getAllStadiums as jest.Mock).mockResolvedValue([{ ...ground, home_team: undefined }]);

    const result = (await tool('search_stadiums').run({ query: 'london' })) as ToolOutput;
    expect(result.items).toEqual([{ slug: 'brisbane-road', name: 'Brisbane Road', city: 'London', country: 'England', capacity: 9271 }]);
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
    (stadiums.getMatchesAtStadium as jest.Mock).mockResolvedValue([buildMatch(), buildMatch()]);

    const result = (await tool('get_matches_at_stadium').run({ slug: 'brisbane-road', limit: 1 })) as ToolOutput;
    expect(result).toMatchObject({ total: 2, has_more: true });
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
