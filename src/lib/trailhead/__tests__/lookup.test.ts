import { CATALOGUE } from '../catalogue';
import { TrailheadError } from '../errors';
import { getTrickOrTrailheadResult, lookupTrickOrTrailhead } from '../lookup';
import notFound from './fixtures/not-found.json';
import {
  RECORDED_PAGES,
  fakeTrailheadFetch,
  jsonResponse,
  pageWith,
  requestVariables,
  respondWith,
} from '@/test-utils/trailhead-fetch';

// Ellie's recorded profile holds 2019-2022 and 2024-2026.
const ELLIES_YEARS = [2026, 2025, 2024, 2022, 2021, 2020, 2019];

describe('lookupTrickOrTrailhead', () => {
  it('scores the recorded profile against the real catalogue', async () => {
    // Ellie doesn't have 2023, so the MODULE scan would run past the two
    // recorded pages (13 in all); leaving it out makes MODULE stop after
    // page 2, where 2024 is.
    const fetchImpl = fakeTrailheadFetch();
    const catalogue = CATALOGUE.filter((badge) => badge.awardType === 'EVENT' || badge.year !== 2023);

    const result = await lookupTrickOrTrailhead('elliematthewman', catalogue, fetchImpl);

    expect(result.status).toBe('found');
    if (result.status !== 'found') return;
    expect(result.earned.map((b) => b.year)).toEqual(ELLIES_YEARS);
    expect(result.missing.map((b) => b.year)).toEqual([2018, 2017, 2016, 2015]);
    expect(result.total).toBe(catalogue.length);
    expect(result.unmatched).toEqual([]);
    expect(result.profile.name).toBe('Ellie Matthewman');
    // EVENT runs to its last page, since 2015-2018 aren't there.
    expect(requestVariables(fetchImpl).map((v) => v.filter)).toEqual(['EVENT', 'EVENT', 'EVENT', 'MODULE', 'MODULE']);
  });

  it('stops each award type as soon as its catalogue badges are found', async () => {
    const fetchImpl = fakeTrailheadFetch();
    const catalogue = CATALOGUE.filter((badge) => [2026, 2025, 2022].includes(badge.year));

    const result = await lookupTrickOrTrailhead('elliematthewman', catalogue, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.status === 'found' && result.missing).toEqual([]);
  });

  it('returns not-found as a value, so it can be cached', async () => {
    await expect(lookupTrickOrTrailhead('nobody', CATALOGUE, respondWith(jsonResponse(notFound)))).resolves.toEqual({
      status: 'not-found',
    });
  });

  it('throws every other failure', async () => {
    const privateProfile = jsonResponse({ data: { profile: { __typename: 'PrivateProfile' } } });
    await expect(lookupTrickOrTrailhead('hidden', CATALOGUE, respondWith(privateProfile))).rejects.toMatchObject({
      code: 'PRIVATE_PROFILE',
    });
  });

  it('lists an unknown edition as unmatched', async () => {
    const page = pageWith([{ id: 'new', title: 'Trick or Trailhead: Next Year', type: 'MODULE' }]);
    const fetchImpl = fakeTrailheadFetch({ EVENT: [pageWith([])], MODULE: [page] });

    const result = await lookupTrickOrTrailhead('someone', CATALOGUE, fetchImpl);

    expect(result.status === 'found' && result.unmatched.map((a) => a.title)).toEqual(['Trick or Trailhead: Next Year']);
  });
});

describe('getTrickOrTrailheadResult', () => {
  const originalFetch = global.fetch;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('rethrows a private profile after a single upstream call, without the cache fallback', async () => {
    global.fetch = respondWith(jsonResponse({ data: { profile: { __typename: 'PrivateProfile' } } }));

    const error = await getTrickOrTrailheadResult('hidden-user').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TrailheadError);
    expect((error as TrailheadError).code).toBe('PRIVATE_PROFILE');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('never logs the username', async () => {
    global.fetch = fakeTrailheadFetch({ ...RECORDED_PAGES, MODULE: [pageWith([])] });

    await getTrickOrTrailheadResult('elliematthewman');

    const logs = JSON.stringify([...consoleLogSpy.mock.calls, ...consoleErrorSpy.mock.calls]);
    expect(logs).not.toContain('elliematthewman');
  });
});
