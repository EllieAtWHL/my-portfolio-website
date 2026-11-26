// Read-only MCP tools over the Spurs Women data layer (WEB-249). Shared by the
// public /api/mcp server and (from WEB-250) the private admin one.
//
// SECURITY: this module is served publicly. It must only ever read through
// the cached src/lib/data/ fetchers (anon-key client, RLS applies) - never
// import supabaseAdmin or anything write-capable here. Write tools live in a
// separate module that only the admin route imports (WEB-251).
//
// QUOTA: Vercel Hobby and Supabase Free hard-cap usage, and these quotas are
// shared with the whole site. Every list tool is paginated with a capped page
// size, there is deliberately no "dump everything" tool, and every read goes
// through the data layer's cache, so repeat questions rarely reach Supabase.
//
// Tools are plain data (name, zod schema, handler) rather than registered
// inline, so they can be unit tested without the ESM-only MCP SDK - the SDK is
// only touched by registerReadTools (type-only import) and the route itself.
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import { getMatchById, getPreviousMatches, getSeasonMatches, getUpcomingMatches } from '@/lib/data/matches';
import { getAllPlayers, getPlayerById, getPlayerMatchHistory, getTeamLineupsByMatch } from '@/lib/data/players';
import { getAllSeasonStats, getSeasonById, getSeasonReview, getSeasonsWithMatchCounts } from '@/lib/data/seasons';
import { getAllTeams, getMatchesForTeam, getTeamById } from '@/lib/data/teams';
import { getAllStadiumNames, getAllStadiums, getMatchesAtStadium, getStadiumBySlug } from '@/lib/data/stadiums';
import { getMediaByMatch } from '@/lib/data/media';
import { getSpursWomenNews } from '@/lib/data/news';
import type { Match } from '@/lib/data/matches';
import {
  describeMatch,
  describePlayer,
  describeStadium,
  summariseLineupPlayer,
  summariseMatch,
  summariseMedia,
  summariseSquadPlayer,
  summariseStadium,
  summariseTeam,
} from './format';
import { getFinalScore, getMatchResult, type MatchScoreFields } from '@/lib/utils/match-result';

export const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;
const MAX_RECENT_MATCHES = 20;
const MAX_NEWS_ITEMS = 10;
const NEWS_SNIPPET_LENGTH = 300;

/** Thrown by a handler for an expected, explainable failure (e.g. not found). */
export class ToolInputError extends Error {}

export interface ReadTool {
  name: string;
  title: string;
  description: string;
  inputSchema: z.ZodObject;
  /** Validates raw arguments against inputSchema, then runs the tool. */
  run: (args: unknown) => Promise<unknown>;
}

function defineTool<S extends z.ZodObject>(definition: {
  name: string;
  title: string;
  description: string;
  inputSchema: S;
  handler: (args: z.infer<S>) => Promise<unknown>;
}): ReadTool {
  return {
    name: definition.name,
    title: definition.title,
    description: definition.description,
    inputSchema: definition.inputSchema,
    run: async (args) => definition.handler(definition.inputSchema.parse(args ?? {})),
  };
}

const pagingShape = {
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE)
    .describe(`Page size (max ${MAX_PAGE_SIZE}).`),
  offset: z.number().int().min(0).default(0).describe('Number of items to skip, for paging.'),
};

export function paginate<T>(items: T[], { limit, offset }: { limit: number; offset: number }) {
  return {
    total: items.length,
    offset,
    limit,
    has_more: offset + limit < items.length,
    items: items.slice(offset, offset + limit),
  };
}

// Letters NFD doesn't decompose into base + accent - they're distinct letters,
// not accented ones - so the combining-mark strip below can't reach them.
// Matters for this squad: Scandinavian names are common.
const STANDALONE_LETTERS: Record<string, string> = {
  'ø': 'o', 'æ': 'ae', 'œ': 'oe', 'ł': 'l', 'đ': 'd', 'ð': 'd', 'þ': 'th', 'ß': 'ss',
};

// Case- and accent-insensitive, so "bjorn" finds "Bjørn", "zoe" finds "Zoë"
// and "spurs" finds "Spurs".
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[øæœłđðþß]/g, (letter) => STANDALONE_LETTERS[letter]);
}

function matchesQuery(query: string, ...fields: (string | null | undefined)[]): boolean {
  const needle = normalise(query.trim());
  return fields.some((field) => field != null && normalise(field).includes(needle));
}

// Match, player and season ids are UUIDs. Validating the shape up front turns
// a typo into a clear validation message instead of a Postgres "invalid input
// syntax for type uuid" error surfacing as a generic failure. z.guid() rather
// than z.uuid(): it checks the 8-4-4-4-12 hex shape without enforcing an RFC
// version/variant, so it can't reject an id the database actually holds.
const recordId = z.guid();

const searchQuery = z.string().trim().min(2).max(50).describe('Part of the name to search for (case-insensitive).');

// Win/draw/loss totals over the matches that have a result (see
// src/lib/utils/match-result.ts for how extra time and shootouts count).
// Unplayed fixtures (null scores) are skipped rather than counted as 0-0 draws.
export function summariseRecord(matches: MatchScoreFields[]) {
  const record = { played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0 };
  for (const match of matches) {
    const score = getFinalScore(match);
    const result = getMatchResult(match);
    if (!score || !result) continue;
    record.played += 1;
    if (result === 'W') record.won += 1;
    else if (result === 'D') record.drawn += 1;
    else record.lost += 1;
    record.goals_for += score.spurs;
    record.goals_against += score.opponent;
  }
  return record;
}

function notFound(what: string, id: string | number): never {
  throw new ToolInputError(`No ${what} found with id/slug "${id}". Use the matching search or list tool to find a valid one.`);
}

export const readTools: ReadTool[] = [
  defineTool({
    name: 'get_upcoming_matches',
    title: 'Upcoming matches',
    description: 'Upcoming Tottenham Hotspur Women fixtures, soonest first.',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(MAX_RECENT_MATCHES).default(5).describe(`How many (max ${MAX_RECENT_MATCHES}).`),
    }),
    handler: async ({ limit }) => (await getUpcomingMatches(limit)).map(summariseMatch),
  }),

  defineTool({
    name: 'get_previous_matches',
    title: 'Recent results',
    description: 'The most recent Tottenham Hotspur Women results, newest first. For older matches use get_season or get_matches_v_team.',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(MAX_RECENT_MATCHES).default(5).describe(`How many (max ${MAX_RECENT_MATCHES}).`),
    }),
    handler: async ({ limit }) => (await getPreviousMatches(limit)).map(summariseMatch),
  }),

  defineTool({
    name: 'get_match',
    title: 'Match details',
    description: 'Full details of one match: score, venue, match stats, both line-ups with per-player stats (goals, assists, cards, minutes), and linked media (articles, videos, photos).',
    inputSchema: z.object({
      match_id: recordId.describe('Match id, from any match list.'),
    }),
    handler: async ({ match_id }) => {
      const [match, lineups, media] = await Promise.all([
        getMatchById(match_id),
        getTeamLineupsByMatch(match_id),
        getMediaByMatch(match_id),
      ]);
      if (!match) notFound('match', match_id);

      const teamNames = new Map<number, string>();
      for (const team of [match.home_team, match.away_team]) {
        if (team) teamNames.set(team.id, team.name);
      }

      return {
        ...describeMatch(match),
        lineups: lineups.map((lineup) => ({
          team: teamNames.get(lineup.team_id) ?? null,
          players: lineup.players.map(summariseLineupPlayer),
        })),
        media: media.map(summariseMedia),
      };
    },
  }),

  defineTool({
    name: 'list_seasons',
    title: 'List seasons',
    description: 'Every season on record, with its id (needed by get_season and get_season_review) and number of matches.',
    inputSchema: z.object({}),
    handler: async () => (await getSeasonsWithMatchCounts()).map((season) => ({
      id: season.id,
      name: season.name,
      match_count: season.match_count ?? null,
    })),
  }),

  defineTool({
    name: 'get_season',
    title: 'Season',
    description: "One season's win/draw/loss record and every match in it. Get season ids from list_seasons.",
    inputSchema: z.object({
      season_id: recordId.describe('Season id, from list_seasons.'),
    }),
    handler: async ({ season_id }) => {
      const [season, matches] = await Promise.all([
        getSeasonById(season_id),
        getSeasonMatches(season_id),
      ]);
      if (!season) notFound('season', season_id);
      return {
        id: season.id,
        name: season.name,
        record: summariseRecord(matches),
        matches: matches.map(summariseMatch),
      };
    },
  }),

  defineTool({
    name: 'get_season_review',
    title: 'Season review',
    description: 'The written end-of-season review for a season, if one has been published.',
    inputSchema: z.object({
      season_id: recordId.describe('Season id, from list_seasons.'),
    }),
    handler: async ({ season_id }) => {
      const [season, review] = await Promise.all([getSeasonById(season_id), getSeasonReview(season_id)]);
      if (!season) notFound('season', season_id);
      // A valid season without a review yet isn't a bad id - say so, so the
      // model doesn't go hunting for a "correct" season id.
      if (!review) throw new ToolInputError(`No review has been published for the ${season.name} season yet.`);
      return { season_id: review.season_id, title: review.title, content: review.content, highlights: review.highlights ?? [] };
    },
  }),

  defineTool({
    name: 'get_season_stats',
    title: 'Season-by-season stats',
    description: 'League stats for every season side by side: win %, goals scored and conceded per game, average possession, shots and corners. Also the % of matches the site owner attended in person (not crowd figures - those are per match, as attendance).',
    inputSchema: z.object({}),
    // Renamed rather than passed through: the site's attendancePercentage is
    // the share of matches the site owner went to, which a model would
    // otherwise read as how full the grounds were.
    handler: async () => (await getAllSeasonStats()).map(({ attendancePercentage, ...stats }) => ({
      ...stats,
      percentageOfMatchesSiteOwnerAttended: attendancePercentage,
    })),
  }),

  defineTool({
    name: 'search_players',
    title: 'Search players',
    description: 'Find players by name. Returns ids (needed by get_player and get_player_history) with career Tottenham appearances, goals and assists.',
    inputSchema: z.object({ query: searchQuery, ...pagingShape }),
    handler: async ({ query, limit, offset }) => {
      const players = (await getAllPlayers()).filter((player) =>
        matchesQuery(query, player.first_name, player.last_name, `${player.first_name ?? ''} ${player.last_name}`)
      );
      return paginate(players.map(summariseSquadPlayer), { limit, offset });
    },
  }),

  defineTool({
    name: 'get_player',
    title: 'Player profile',
    description: "A player's profile: position, nationality, date of birth, squad number, current club and full club history.",
    inputSchema: z.object({
      player_id: recordId.describe('Player id, from search_players.'),
    }),
    handler: async ({ player_id }) => {
      const player = await getPlayerById(player_id);
      if (!player) notFound('player', player_id);
      return describePlayer(player);
    },
  }),

  defineTool({
    name: 'get_player_history',
    title: 'Player match history',
    description: "A player's match-by-match appearances (newest first) with their stats in each: started, minutes, goals, assists, cards, rating.",
    inputSchema: z.object({
      player_id: recordId.describe('Player id, from search_players.'),
      ...pagingShape,
    }),
    handler: async ({ player_id, limit, offset }) => {
      const [player, appearances] = await Promise.all([getPlayerById(player_id), getPlayerMatchHistory(player_id)]);
      // Without this an unknown id reads as "no appearances" - indistinguishable
      // from a real player who hasn't played.
      if (!player) notFound('player', player_id);
      return paginate(
        appearances.map((appearance) => ({
          match: summariseMatch(appearance.match),
          started: appearance.started,
          unused_substitute: appearance.was_unused_substitute,
          minutes_played: appearance.minutes_played,
          goals: appearance.goals,
          assists: appearance.assists,
          yellow_cards: appearance.yellow_cards,
          red_cards: appearance.red_cards,
          player_rating: appearance.player_rating,
          player_of_the_match: appearance.player_of_the_match,
        })),
        { limit, offset }
      );
    },
  }),

  defineTool({
    name: 'search_teams',
    title: 'Search teams',
    description: 'Find teams (opponents, and Tottenham itself) by name. Returns ids needed by get_team and get_matches_v_team.',
    inputSchema: z.object({ query: searchQuery, ...pagingShape }),
    handler: async ({ query, limit, offset }) => {
      const teams = (await getAllTeams()).filter((team) => matchesQuery(query, team.name, team.short_name));
      return paginate(teams.map(summariseTeam), { limit, offset });
    },
  }),

  defineTool({
    name: 'get_team',
    title: 'Team and head-to-head',
    description: "A team and Tottenham's all-time head-to-head record against them (played, won, drawn, lost, goals). For Tottenham itself, returns Tottenham's overall all-time record instead. For the individual matches use get_matches_v_team.",
    inputSchema: z.object({
      team_id: z.number().int().positive().describe('Team id, from search_teams.'),
    }),
    handler: async ({ team_id }) => {
      const [team, matches] = await Promise.all([
        getTeamById(String(team_id)),
        getMatchesForTeam(String(team_id)),
      ]);
      if (!team) notFound('team', team_id);
      const record = summariseRecord(matches);
      // Tottenham's "matches involving this team" is every match, so a
      // head-to-head label would read as Spurs v Spurs.
      return team.is_tottenham
        ? { ...summariseTeam(team), all_time_record: record }
        : { ...summariseTeam(team), head_to_head: record };
    },
  }),

  defineTool({
    name: 'get_matches_v_team',
    title: 'Matches against a team',
    description: 'Every Tottenham match against one team, newest first. (For Tottenham itself, every match.)',
    inputSchema: z.object({
      team_id: z.number().int().positive().describe('Team id, from search_teams.'),
      ...pagingShape,
    }),
    handler: async ({ team_id, limit, offset }) => {
      const [team, matches] = await Promise.all([getTeamById(String(team_id)), getMatchesForTeam(String(team_id))]);
      if (!team) notFound('team', team_id);
      return paginate(matches.map(summariseMatch), { limit, offset });
    },
  }),

  defineTool({
    name: 'search_stadiums',
    title: 'Search stadiums',
    description: 'Find grounds Tottenham Hotspur Women have played at, by name (including sponsored and former names) or city. Returns slugs needed by get_stadium and get_matches_at_stadium.',
    inputSchema: z.object({ query: searchQuery, ...pagingShape }),
    handler: async ({ query, limit, offset }) => {
      // Matches report a ground by the name in use on the day (often a
      // sponsor's), which can differ from stadia.name, so search those too.
      const [stadiums, namesByStadium] = await Promise.all([getAllStadiums(), getAllStadiumNames()]);
      const found = stadiums
        .map((stadium) => ({ stadium, otherNames: [...new Set((namesByStadium[stadium.id] ?? []).map((n) => n.name))].filter((n) => n !== stadium.name) }))
        .filter(({ stadium, otherNames }) => matchesQuery(query, stadium.name, stadium.city, ...otherNames));
      return paginate(found.map(({ stadium, otherNames }) => ({ ...summariseStadium(stadium), other_names: otherNames })), { limit, offset });
    },
  }),

  defineTool({
    name: 'get_stadium',
    title: 'Stadium',
    description: "A ground's details and Tottenham's record there.",
    inputSchema: z.object({
      slug: z.string().min(1).max(100).describe('Stadium slug, from search_stadiums or a match.'),
    }),
    handler: async ({ slug }) => {
      const [stadium, matches] = await Promise.all([getStadiumBySlug(slug), getMatchesAtStadium(slug)]);
      if (!stadium) notFound('stadium', slug);
      return { ...describeStadium(stadium), record: summariseRecord(matches) };
    },
  }),

  defineTool({
    name: 'get_matches_at_stadium',
    title: 'Matches at a stadium',
    description: 'Every Tottenham match played at one ground, newest first.',
    inputSchema: z.object({
      slug: z.string().min(1).max(100).describe('Stadium slug, from search_stadiums or a match.'),
      ...pagingShape,
    }),
    handler: async ({ slug, limit, offset }) => {
      const [stadium, matches] = await Promise.all([getStadiumBySlug(slug), getMatchesAtStadium(slug) as Promise<Match[]>]);
      if (!stadium) notFound('stadium', slug);
      return paginate(matches.map(summariseMatch), { limit, offset });
    },
  }),

  defineTool({
    name: 'get_news',
    title: 'Latest news',
    description: 'Latest Tottenham Hotspur Women news headlines with links.',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(MAX_NEWS_ITEMS).default(5).describe(`How many (max ${MAX_NEWS_ITEMS}).`),
    }),
    handler: async ({ limit }) => (await getSpursWomenNews()).slice(0, limit).map((article) => ({
      title: article.title,
      link: article.link,
      date: article.isoDate || article.pubDate,
      source: article.source ?? null,
      snippet: (article.contentSnippet ?? '').slice(0, NEWS_SNIPPET_LENGTH),
    })),
  }),
];

/** Runs a tool and converts its outcome into an MCP tool result. */
export async function callReadTool(tool: ReadTool, args: unknown) {
  try {
    const data = await tool.run(args);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
  } catch (error) {
    // Expected failures (bad id, invalid input) are explained to the model so
    // it can correct itself. Anything else is a server-side fault: log it,
    // but don't leak internals (query text, stack) to a public client.
    let message = 'Something went wrong fetching that data. Try again shortly.';
    if (error instanceof ToolInputError) {
      message = error.message;
    } else if (error instanceof z.ZodError) {
      message = `Invalid input: ${z.prettifyError(error)}`;
    } else {
      console.error(`MCP tool ${tool.name} failed:`, error);
    }
    return { content: [{ type: 'text' as const, text: message }], isError: true };
  }
}

export function registerReadTools(server: McpServer): void {
  for (const tool of readTools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      (args: unknown) => callReadTool(tool, args)
    );
  }
}
