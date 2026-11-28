import { AdminServiceError } from '../errors';
import { PENS_WITHOUT_EXTRA_TIME_WARNING } from '@/lib/admin/match-score-rules';

// A fake of the chained Supabase query builder: records each query's table,
// operation, values and filters, and answers it via `respond`.
interface Query {
  table: string;
  op: 'select' | 'insert' | 'upsert' | 'update' | 'delete';
  values?: unknown;
  options?: unknown;
  selectOptions?: unknown;
  filters: [string, unknown][];
}
type Answer = { data?: unknown; error?: { message: string; code?: string } | null; count?: number | null };

const queries: Query[] = [];
let respond: (query: Query) => Answer = () => ({ data: [], error: null });

function from(table: string) {
  const query: Query = { table, op: 'select', filters: [] };
  queries.push(query);
  const answer = () => Promise.resolve({ data: null, error: null, count: null, ...respond(query) });
  const builder = {
    select: (_columns?: string, options?: unknown) => {
      query.selectOptions = options;
      return builder;
    },
    insert: (values: unknown) => Object.assign(query, { op: 'insert', values }) && builder,
    upsert: (values: unknown, options: unknown) => Object.assign(query, { op: 'upsert', values, options }) && builder,
    update: (values: unknown) => Object.assign(query, { op: 'update', values }) && builder,
    delete: () => Object.assign(query, { op: 'delete' }) && builder,
    eq: (column: string, value: unknown) => {
      query.filters.push([column, value]);
      return builder;
    },
    maybeSingle: answer,
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => answer().then(resolve, reject),
  };
  return builder;
}

jest.mock('@/lib/admin-api', () => ({ supabaseAdmin: { from: (table: string) => from(table) } }));

jest.mock('@/lib/data/cache-invalidation', () => ({
  invalidateMatchCache: jest.fn(),
  invalidateStadiumCache: jest.fn(),
  invalidatePlayerCache: jest.fn(),
  invalidateTeamCache: jest.fn(),
  invalidateMediaCache: jest.fn(),
  invalidatePlayerHistoryCache: jest.fn(),
  invalidatePlayerStatsCache: jest.fn(),
  invalidateStadiumNamesCache: jest.fn(),
}));

import * as cacheInvalidation from '@/lib/data/cache-invalidation';
import * as services from '../index';

const invalidation = cacheInvalidation as unknown as Record<string, jest.Mock>;

const MATCH_ID = '11111111-1111-4111-8111-111111111111';
const UUID_A = '22222222-2222-4222-8222-222222222222';
const UUID_B = '33333333-3333-4333-8333-333333333333';

const validMatch = {
  season_id: UUID_A,
  competition_id: UUID_B,
  date: '2026-02-23',
  kickoff_time: '14:00',
  is_home_match: true,
  home_team_id: 1,
  away_team_id: 2,
  stadium_id: UUID_A,
  attended: false,
  notes: '',
  spurs_score: 1,
  opponent_score: 1,
  spurs_score_aet: null,
  opponent_score_aet: null,
  spurs_score_pens: null,
  opponent_score_pens: null,
};

const writes = () => queries.filter((q) => q.op !== 'select');

async function expectServiceError(promise: Promise<unknown>, status: 400 | 404, message?: string | RegExp) {
  const error = await promise.then(
    () => {
      throw new Error('expected the service to reject');
    },
    (e: unknown) => e
  );
  expect(error).toBeInstanceOf(AdminServiceError);
  expect((error as AdminServiceError).status).toBe(status);
  if (message) expect((error as AdminServiceError).message).toMatch(message);
}

beforeEach(() => {
  queries.length = 0;
  respond = (query) => ({ data: query.op === 'select' ? null : [{ id: MATCH_ID }], error: null });
  jest.clearAllMocks();
});

describe('match service', () => {
  describe('createMatch', () => {
    it('inserts a valid match and invalidates the match and stadium caches', async () => {
      const result = await services.createMatch(validMatch);

      expect(result).toEqual({ data: [{ id: MATCH_ID }], warnings: [] });
      expect(writes()).toEqual([expect.objectContaining({ table: 'matches', op: 'insert' })]);
      expect(invalidation.invalidateMatchCache).toHaveBeenCalledTimes(1);
      expect(invalidation.invalidateStadiumCache).toHaveBeenCalledTimes(1);
    });

    it('stores blank text, select and score inputs as null, never "" or 0', async () => {
      await services.createMatch({ ...validMatch, notes: '  ', kickoff_time: '', stadium_id: '', spurs_score: null, opponent_score: null });

      expect(writes()[0].values).toEqual(
        expect.objectContaining({ notes: null, kickoff_time: null, stadium_id: null, spurs_score: null, opponent_score: null })
      );
    });

    it('strips keys that are not writable columns', async () => {
      await services.createMatch({ ...validMatch, id: MATCH_ID, created_at: 'x', stadium_display_name: 'y' });

      const values = writes()[0].values as Record<string, unknown>;
      expect(values).not.toHaveProperty('id');
      expect(values).not.toHaveProperty('created_at');
      expect(values).not.toHaveProperty('stadium_display_name');
    });

    it.each([
      ['a missing season', { season_id: undefined }, /season_id/],
      ['a bad date', { date: '23/02/2026' }, /date: must be a date/],
      ['a negative score', { spurs_score: -1 }, /spurs_score: can't be negative/],
      ['a fractional score', { spurs_score: 1.5 }, /spurs_score: must be a whole number/],
      ['a string score', { spurs_score: '2' }, /spurs_score/],
      ['a bad kickoff time', { kickoff_time: '25:00' }, /kickoff_time/],
      ['a uuid team id', { home_team_id: UUID_A }, /home_team_id/],
      ['possession over 100', { home_possession: 101 }, /home_possession: must be 0-100/],
      ['the same team twice', { away_team_id: 1 }, /home and away teams must be different/],
      ['more shots on target than shots', { home_total_shots: 2, home_shots_on_target: 3 }, /Home shots on target/],
    ])('rejects %s with a 400 and writes nothing', async (_label, change, message) => {
      await expectServiceError(services.createMatch({ ...validMatch, ...change }), 400, message);
      expect(writes()).toEqual([]);
      expect(invalidation.invalidateMatchCache).not.toHaveBeenCalled();
    });

    it('rejects input that is not an object', async () => {
      await expectServiceError(services.createMatch('nope'), 400);
    });

    it.each([
      ['a half-entered extra-time score', { spurs_score_aet: 2 }, 'Enter both extra-time scores, or neither.'],
      ['extra time after a decisive 90 minutes', { spurs_score: 2, spurs_score_aet: 3, opponent_score_aet: 1 }, 'Extra time is only possible'],
      ['penalties after a decisive extra time', { spurs_score_aet: 2, opponent_score_aet: 1, spurs_score_pens: 4, opponent_score_pens: 3 }, 'Penalties are only possible'],
      ['a level shootout', { spurs_score_pens: 4, opponent_score_pens: 4 }, 'can\'t end level'],
      ['extra-time goals going down', { spurs_score_aet: 0, opponent_score_aet: 0 }, 'can\'t be lower'],
    ])('enforces the match score rules: rejects %s', async (_label, change, message) => {
      await expectServiceError(services.createMatch({ ...validMatch, ...change }), 400, message);
      expect(writes()).toEqual([]);
    });

    it('saves penalties with no extra-time score, returning the warning', async () => {
      const result = await services.createMatch({ ...validMatch, spurs_score_pens: 4, opponent_score_pens: 3 });

      expect(result.warnings).toEqual([PENS_WITHOUT_EXTRA_TIME_WARNING]);
      expect(writes()).toHaveLength(1);
    });

    it('maps a database constraint violation to a 400', async () => {
      respond = (q) => (q.op === 'insert' ? { data: null, error: { message: 'violates foreign key', code: '23503' } } : {});
      await expectServiceError(services.createMatch(validMatch), 400, 'violates foreign key');
      expect(invalidation.invalidateMatchCache).not.toHaveBeenCalled();
    });

    it('treats any other database error as unexpected (a 500)', async () => {
      respond = (q) => (q.op === 'insert' ? { data: null, error: { message: 'connection reset', code: '08006' } } : {});
      const error = await services.createMatch(validMatch).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(AdminServiceError);
    });
  });

  describe('updateMatch', () => {
    const stored = { ...validMatch, id: MATCH_ID, notes: null };

    it('checks the score rules against the stored row merged with the changes', async () => {
      respond = (q) => (q.op === 'select' ? { data: stored } : { data: [{ id: MATCH_ID }] });

      const result = await services.updateMatch({ id: MATCH_ID, spurs_score_aet: 2, opponent_score_aet: 1 });

      expect(result.warnings).toEqual([]);
      const update = writes()[0];
      expect(update).toEqual(expect.objectContaining({ op: 'update', filters: [['id', MATCH_ID]] }));
      expect(update.values).toEqual({ spurs_score_aet: 2, opponent_score_aet: 1 });
    });

    it('rejects a partial change that breaks a rule given the stored scores', async () => {
      respond = (q) => (q.op === 'select' ? { data: { ...stored, spurs_score: 2 } } : { data: [] });

      await expectServiceError(
        services.updateMatch({ id: MATCH_ID, spurs_score_aet: 2, opponent_score_aet: 2 }),
        400,
        'Extra time is only possible'
      );
      expect(writes()).toEqual([]);
    });

    it('returns a 404 when the match does not exist', async () => {
      respond = () => ({ data: null });
      await expectServiceError(services.updateMatch({ id: MATCH_ID, notes: 'x' }), 404, 'Match not found');
      expect(writes()).toEqual([]);
    });

    it('requires a valid id', async () => {
      await expectServiceError(services.updateMatch({ notes: 'x' }), 400, /id/);
      await expectServiceError(services.updateMatch({ id: 'not-a-uuid', notes: 'x' }), 400, /id: must be a valid id/);
    });

    it('refuses an update with nothing to change', async () => {
      await expectServiceError(services.updateMatch({ id: MATCH_ID, unknown_column: 1 }), 400, 'Nothing to update');
    });
  });

  describe('deleteMatch', () => {
    it('deletes by id and invalidates caches', async () => {
      await services.deleteMatch({ id: MATCH_ID });
      expect(writes()).toEqual([expect.objectContaining({ op: 'delete', filters: [['id', MATCH_ID]] })]);
      expect(invalidation.invalidateMatchCache).toHaveBeenCalled();
    });

    it('returns a 404 when nothing was deleted', async () => {
      respond = () => ({ data: [] });
      await expectServiceError(services.deleteMatch({ id: MATCH_ID }), 404);
      expect(invalidation.invalidateMatchCache).not.toHaveBeenCalled();
    });

    it('rejects a missing id', async () => {
      await expectServiceError(services.deleteMatch({}), 400, /id/);
    });
  });
});

describe('stadium service', () => {
  const stadium = { name: 'Brisbane Road', slug: 'brisbane-road', spurs_women: true };

  it('validates slug format and coordinates', async () => {
    await expectServiceError(services.createStadium({ ...stadium, slug: 'Brisbane Road' }), 400, /slug/);
    await expectServiceError(services.createStadium({ ...stadium, latitude: 91 }), 400, /latitude/);
  });

  it('rejects a closed date before the opened date', async () => {
    await expectServiceError(
      services.createStadium({ ...stadium, opened_date: '2000-01-01', closed_date: '1999-01-01' }),
      400,
      'closed date'
    );
  });

  it('refuses to un-tick "Spurs Women ground" on a ground with matches', async () => {
    respond = (q) => {
      if (q.table === 'matches') return { count: 3 };
      return q.op === 'select' ? { data: { ...stadium, id: UUID_A } } : { data: [{ id: UUID_A }] };
    };

    await expectServiceError(
      services.updateStadium({ id: UUID_A, spurs_women: false }),
      400,
      'This ground has 3 matches, so it has to stay a Spurs Women ground.'
    );
    const matchCount = queries.find((q) => q.table === 'matches');
    expect(matchCount?.filters).toEqual([['stadium_id', UUID_A]]);
    expect(writes()).toEqual([]);
  });

  it('allows un-ticking it on a ground with no matches', async () => {
    respond = (q) => {
      if (q.table === 'matches') return { count: 0 };
      return q.op === 'select' ? { data: { ...stadium, id: UUID_A } } : { data: [{ id: UUID_A }] };
    };

    await services.updateStadium({ id: UUID_A, spurs_women: false });
    expect(writes()).toEqual([expect.objectContaining({ table: 'stadia', op: 'update', values: { spurs_women: false } })]);
    expect(invalidation.invalidateStadiumCache).toHaveBeenCalled();
  });
});

describe('stadium name service', () => {
  it('supports updates (the admin form edits names with a PUT)', async () => {
    respond = (q) =>
      q.op === 'select'
        ? { data: { id: UUID_A, stadium_id: UUID_B, name: 'Old', valid_from: '2020-01-01', valid_to: null } }
        : { data: [{ id: UUID_A }] };

    await services.updateStadiumName({ id: UUID_A, name: 'New' });
    expect(writes()).toEqual([expect.objectContaining({ table: 'stadium_names', op: 'update', values: { name: 'New' } })]);
    expect(invalidation.invalidateStadiumNamesCache).toHaveBeenCalled();
  });

  it('requires valid_from and rejects valid_to before it', async () => {
    await expectServiceError(services.createStadiumName({ stadium_id: UUID_B, name: 'X' }), 400, /valid_from/);
    await expectServiceError(
      services.createStadiumName({ stadium_id: UUID_B, name: 'X', valid_from: '2020-01-01', valid_to: '2019-01-01' }),
      400,
      'Valid To can\'t be before Valid From.'
    );
  });
});

describe('player service', () => {
  it('stores blanks as null and validates position and image URL', async () => {
    await services.createPlayer({ first_name: '', last_name: 'Grant', position: '', profile_image_url: '' });
    expect(writes()[0].values).toEqual({ first_name: null, last_name: 'Grant', position: null, profile_image_url: null });

    await expectServiceError(services.createPlayer({ last_name: 'Grant', position: 'Winger' }), 400, /position/);
    await expectServiceError(services.createPlayer({ last_name: 'Grant', profile_image_url: 'javascript:alert(1)' }), 400, /profile_image_url/);
    await expectServiceError(services.createPlayer({ last_name: '   ' }), 400, 'last_name: is required');
  });
});

describe('team service', () => {
  it('uses integer ids', async () => {
    respond = (q) => (q.op === 'select' ? { data: { id: 5 } } : { data: [{ id: 5 }] });
    await services.updateTeam({ id: 5, name: 'Arsenal' });
    expect(writes()[0].filters).toEqual([['id', 5]]);

    await expectServiceError(services.deleteTeam({ id: UUID_A }), 400, /id/);
  });
});

describe('media service', () => {
  const media = { match_id: MATCH_ID, type: 'article', url: 'https://www.bbc.co.uk/sport' };

  it('requires an http(s) link, except for a photo album folder key', async () => {
    await services.createMedia(media);
    await services.createMedia({ ...media, type: 'photo album', url: '2023-24/20231008 WSL Spurs v Man Utd' });
    expect(writes()).toHaveLength(2);

    await expectServiceError(services.createMedia({ ...media, url: 'javascript:alert(1)' }), 400, /http/);
    await expectServiceError(services.createMedia({ ...media, type: 'podcast' }), 400, /type/);
  });
});

describe('player history service', () => {
  const stint = { player_id: UUID_A, team_id: 1, joined_on: '2024-07-01' };

  it('rejects leaving before joining, and a loan from the same team', async () => {
    await expectServiceError(services.createPlayerHistory({ ...stint, left_on: '2024-06-30' }), 400, 'Left On');
    await expectServiceError(services.createPlayerHistory({ ...stint, on_loan_from_team_id: 1 }), 400, 'on loan');
  });

  it('stores a blank left_on as null', async () => {
    await services.createPlayerHistory({ ...stint, left_on: '' });
    expect(writes()[0].values).toEqual(expect.objectContaining({ left_on: null }));
    expect(invalidation.invalidatePlayerHistoryCache).toHaveBeenCalled();
  });
});

describe('player stats service', () => {
  const stats = { player_id: UUID_A, match_id: MATCH_ID, team_id: 1, started: true, goals: 1 };

  it('creates with an upsert on player and match', async () => {
    await services.createPlayerStats(stats);
    expect(writes()).toEqual([
      expect.objectContaining({ table: 'player_stats', op: 'upsert', options: { onConflict: 'player_id, match_id', ignoreDuplicates: false } }),
    ]);
    expect(invalidation.invalidatePlayerStatsCache).toHaveBeenCalled();
  });

  it.each([
    ['minute off before minute on', { minute_on: 60, minute_off: 45 }, 'Minute off'],
    ['more shots on target than shots', { shots: 1, shots_on_target: 2 }, 'Shots on target'],
    ['more passes completed than attempted', { passes_completed: 10, passes_attempted: 5 }, 'Passes completed'],
    ['a rating over 10', { player_rating: 10.5 }, /player_rating/],
    ['two red cards', { red_cards: 2 }, /red_cards/],
    ['a null goal count', { goals: null }, /goals/],
  ])('rejects %s', async (_label, change, message) => {
    await expectServiceError(services.createPlayerStats({ ...stats, ...change }), 400, message);
    expect(writes()).toEqual([]);
  });
});
