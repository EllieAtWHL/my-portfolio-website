import { readFileSync } from 'fs';
import { join } from 'path';
import {
  BADGES_QUERY,
  LOOKUP_DEADLINE_MS,
  MAX_PAGES_PER_TYPE,
  PAGE_SIZE,
  REQUEST_TIMEOUT_MS,
  TRAILHEAD_GRAPHQL_URL,
  fetchEarnedAwards,
} from '../client';
import { TrailheadError } from '../errors';
import nullAwardPage from './fixtures/event-page-1-size-100-award-null.json';
import notFound from './fixtures/not-found.json';
import {
  RECORDED_PAGES,
  fakeTrailheadFetch,
  jsonResponse,
  pageWith,
  requestVariables,
  respondWith,
} from '@/test-utils/trailhead-fetch';

const privateProfile = { data: { profile: { __typename: 'PrivateProfile' } } };

async function expectFailure(promise: Promise<unknown>, code: TrailheadError['code']) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(TrailheadError);
  expect((error as TrailheadError).code).toBe(code);
  return error as TrailheadError;
}

describe('fetchEarnedAwards', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.useRealTimers();
  });

  it('sends the same query the fixtures were recorded with', () => {
    const recorded = readFileSync(join(__dirname, 'fixtures/query.graphql'), 'utf8');
    expect(BADGES_QUERY.trim()).toBe(recorded.trim());
  });

  it('pages through every EVENT page, then MODULE, at a page size of 50', async () => {
    const fetchImpl = fakeTrailheadFetch({
      EVENT: RECORDED_PAGES.EVENT,
      MODULE: [pageWith([])],
    });

    const result = await fetchEarnedAwards('elliematthewman', { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(fetchImpl.mock.calls[0][0]).toBe(TRAILHEAD_GRAPHQL_URL);
    const variables = requestVariables(fetchImpl);
    expect(variables.map((v) => v.filter)).toEqual(['EVENT', 'EVENT', 'EVENT', 'MODULE']);
    expect(variables.every((v) => v.count === PAGE_SIZE && v.slug === 'elliematthewman')).toBe(true);
    expect(variables[0].after).toBeNull();
    expect(variables[1].after).not.toBeNull();
    expect(variables[3].after).toBeNull();

    expect(result.awards).toHaveLength(123);
    expect(result.awards.map((a) => a.title)).toContain(' Trick or Trailhead VI');
    expect(result.incomplete).toBe(false);
  });

  it('takes the profile name and avatar from the first page', async () => {
    const result = await fetchEarnedAwards('elliematthewman', {
      fetchImpl: fakeTrailheadFetch(),
      isComplete: (type) => type === 'MODULE',
    });

    expect(result.profile).toEqual({
      name: 'Ellie Matthewman',
      avatarUrl: expect.stringMatching(/^https:\/\/profile\.digital\.salesforce\.com\//),
    });
  });

  it('maps award fields, including the module web URL', async () => {
    const result = await fetchEarnedAwards('elliematthewman', {
      fetchImpl: fakeTrailheadFetch(),
      isComplete: () => true,
    });

    expect(result.awards).toContainEqual({
      id: '03188f1d-5165-69ca-68b7-b70a2900301a',
      title: 'Trick or Trailhead: Tell Us S’more Campfire Stories',
      type: 'MODULE',
      icon: expect.stringContaining('_badge.png'),
      webUrl: 'https://trailhead.salesforce.com/content/learn/modules/trick-or-trailhead-tell-us-smore-campfire-stories',
    });
  });

  it('stops a type early once isComplete says so, passing only that type\'s awards', async () => {
    const fetchImpl = fakeTrailheadFetch();
    const isComplete = jest.fn(
      (type: string, awards: Array<{ type: string }>) => type === 'EVENT' || awards.length >= 100
    );

    const result = await fetchEarnedAwards('elliematthewman', { fetchImpl, isComplete });

    // EVENT stops after page 1 of 3; MODULE stops after page 2 of 13, even
    // though page 2 says hasNextPage (recording only has two pages).
    expect(requestVariables(fetchImpl).map((v) => v.filter)).toEqual(['EVENT', 'MODULE', 'MODULE']);
    expect(isComplete.mock.calls.every(([type, awards]) => awards.every((a) => a.type === type))).toBe(true);
    expect(result.awards).toHaveLength(150);
    expect(result.incomplete).toBe(false);
  });

  it('flags the result incomplete when a type hits the page cap', async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse(pageWith([{ id: 'a', title: 'Some module', type: 'MODULE' }], { hasNextPage: true, endCursor: 'next' }))
    );

    const result = await fetchEarnedAwards('elliematthewman', { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(MAX_PAGES_PER_TYPE * 2);
    expect(result.incomplete).toBe(true);
  });

  it('stops starting new pages at the deadline and flags the result incomplete', async () => {
    let clock = 0;
    const fetchImpl = jest.fn(async () => {
      clock += 6000;
      return jsonResponse(pageWith([{ id: 'a', title: 'x', type: 'EVENT' }], { hasNextPage: true, endCursor: 'next' }));
    });

    const result = await fetchEarnedAwards('elliematthewman', { fetchImpl, now: () => clock });

    // Pages start at 0s, 6s, 12s and 18s; at 24s it's past the 20s deadline.
    expect(LOOKUP_DEADLINE_MS).toBe(20_000);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(result.incomplete).toBe(true);
    expect(result.awards).toHaveLength(4);
  });

  it('always fetches the first page, however late it starts', async () => {
    let clock = 0;
    const fetchImpl = jest.fn(async () => {
      clock += 60_000;
      return jsonResponse(pageWith([], { hasNextPage: true, endCursor: 'next' }));
    });

    const result = await fetchEarnedAwards('elliematthewman', { fetchImpl, now: () => clock });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.profile.name).toBe('Test Trailblazer');
    expect(result.incomplete).toBe(true);
  });

  it('fails the whole lookup on any award: null, rather than skipping it', async () => {
    const error = await expectFailure(
      fetchEarnedAwards('elliematthewman', { fetchImpl: respondWith(jsonResponse(nullAwardPage)) }),
      'UPSTREAM_CHANGED'
    );
    expect(error.message).toContain('award is null');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('fails on a single null award among valid ones', async () => {
    const page = pageWith([{ id: 'a', title: 'Trick or Trailhead VIII', type: 'EVENT' }, null]);
    await expectFailure(
      fetchEarnedAwards('elliematthewman', { fetchImpl: respondWith(jsonResponse(page)) }),
      'UPSTREAM_CHANGED'
    );
  });

  it('reports an unknown username as NOT_FOUND', async () => {
    await expectFailure(
      fetchEarnedAwards('nobody', { fetchImpl: respondWith(jsonResponse(notFound)) }),
      'NOT_FOUND'
    );
  });

  it('reports a private profile as PRIVATE_PROFILE', async () => {
    await expectFailure(
      fetchEarnedAwards('hidden', { fetchImpl: respondWith(jsonResponse(privateProfile)) }),
      'PRIVATE_PROFILE'
    );
  });

  it('reports HTTP 429 as RATE_LIMITED without retrying', async () => {
    const fetchImpl = respondWith(new Response('Too Many Requests', { status: 429 }));
    await expectFailure(fetchEarnedAwards('elliematthewman', { fetchImpl }), 'RATE_LIMITED');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('reports HTTP 200 + TOO_MANY_REQUESTS as RATE_LIMITED', async () => {
    const body = { errors: [{ message: 'Too many requests', extensions: { code: 'TOO_MANY_REQUESTS' } }], data: null };
    const fetchImpl = respondWith(jsonResponse(body));
    await expectFailure(fetchEarnedAwards('elliematthewman', { fetchImpl }), 'RATE_LIMITED');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('stops paging when a later page fails', async () => {
    const first = pageWith([{ id: 'a', title: 'x', type: 'EVENT' }], { hasNextPage: true, endCursor: 'next' });
    const fetchImpl = respondWith(jsonResponse(first), new Response('', { status: 429 }));
    await expectFailure(fetchEarnedAwards('elliematthewman', { fetchImpl }), 'RATE_LIMITED');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('reports a removed field (undefinedField) as UPSTREAM_CHANGED', async () => {
    const body = { errors: [{ message: 'Field "avatarUrl" not found', extensions: { code: 'undefinedField' } }] };
    await expectFailure(
      fetchEarnedAwards('elliematthewman', { fetchImpl: respondWith(jsonResponse(body, 400)) }),
      'UPSTREAM_CHANGED'
    );
  });

  it.each([
    ['a non-object body', []],
    ['no profile', { data: {} }],
    ['an unknown profile type', { data: { profile: { __typename: 'SomethingNew' } } }],
    ['no earnedAwards', { data: { profile: { __typename: 'PublicProfile', name: 'x', avatarUrl: null } } }],
    ['a non-string name', { data: { profile: { ...pageWith([]).data.profile, name: 42 } } }],
    ['malformed pageInfo', { data: { profile: { ...pageWith([]).data.profile, earnedAwards: { edges: [], pageInfo: {} } } } }],
    ['hasNextPage without a cursor', pageWith([], { hasNextPage: true, endCursor: null })],
    ['an edge without a node', { data: { profile: { ...pageWith([]).data.profile, earnedAwards: { edges: [{}], pageInfo: { hasNextPage: false, endCursor: null } } } } }],
    ['an award without a title', pageWith([{ id: 'a', type: 'EVENT' } as never])],
    ['a non-string icon', { data: { profile: { ...pageWith([]).data.profile, earnedAwards: { edges: [{ node: { award: { id: 'a', title: 't', type: 'EVENT', icon: 1 } } }], pageInfo: { hasNextPage: false, endCursor: null } } } } }],
    ['malformed content', { data: { profile: { ...pageWith([]).data.profile, earnedAwards: { edges: [{ node: { award: { id: 'a', title: 't', type: 'EVENT', content: 'x' } } }], pageInfo: { hasNextPage: false, endCursor: null } } } } }],
  ])('reports %s as UPSTREAM_CHANGED, logged, never as an empty result', async (_label, body) => {
    await expectFailure(
      fetchEarnedAwards('elliematthewman', { fetchImpl: respondWith(jsonResponse(body)) }),
      'UPSTREAM_CHANGED'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Trailhead response failed validation'));
  });

  it('accepts awards with missing optional fields', async () => {
    const body = { data: { profile: { ...pageWith([]).data.profile, earnedAwards: { edges: [{ node: { award: { id: 'a', title: 't', type: 'EVENT' } } }], pageInfo: { hasNextPage: false } } } } };
    const result = await fetchEarnedAwards('elliematthewman', { fetchImpl: jest.fn(async () => jsonResponse(body)) });
    expect(result.awards[0]).toEqual({ id: 'a', title: 't', type: 'EVENT', icon: null, webUrl: null });
  });

  it('reports a non-JSON 200 as UPSTREAM_CHANGED', async () => {
    await expectFailure(
      fetchEarnedAwards('elliematthewman', { fetchImpl: respondWith(new Response('<html>', { status: 200 })) }),
      'UPSTREAM_CHANGED'
    );
  });

  it.each([400, 404, 422])('reports a non-GraphQL HTTP %s as UPSTREAM_CHANGED, logging the status', async (status) => {
    await expectFailure(
      fetchEarnedAwards('elliematthewman', { fetchImpl: respondWith(jsonResponse({ message: 'nope' }, status)) }),
      'UPSTREAM_CHANGED'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(`Trailhead response failed validation: unexpected HTTP ${status}`);
  });

  it('does not accept a valid-looking body with an error status', async () => {
    await expectFailure(
      fetchEarnedAwards('elliematthewman', { fetchImpl: respondWith(jsonResponse(pageWith([]), 404)) }),
      'UPSTREAM_CHANGED'
    );
  });

  it.each([
    ['a 5xx', new Response('Bad gateway', { status: 502 })],
    ['a 5xx with a non-GraphQL JSON body', jsonResponse({ message: 'Internal error' }, 500)],
    ['a 5xx with an empty errors array', jsonResponse({ data: null, errors: [] }, 503)],
    ['a 401 block', jsonResponse({ message: 'Unauthorized' }, 401)],
    ['a 403 block (e.g. of Vercel IPs)', jsonResponse({ message: 'Forbidden' }, 403)],
    ['a network error', new TypeError('fetch failed')],
  ])('reports %s as UPSTREAM_UNAVAILABLE', async (_label, response) => {
    await expectFailure(
      fetchEarnedAwards('elliematthewman', { fetchImpl: respondWith(response) }),
      'UPSTREAM_UNAVAILABLE'
    );
  });

  it('times a request out after 8 seconds', async () => {
    jest.useFakeTimers();
    const fetchImpl = jest.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        })
    );

    const promise = fetchEarnedAwards('elliematthewman', { fetchImpl });
    const assertion = expectFailure(promise, 'UPSTREAM_UNAVAILABLE');
    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS - 1);
    expect(fetchImpl.mock.calls[0][1]?.signal?.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(1);

    const error = await assertion;
    expect(error.message).toBe('Trailhead timed out');
  });

  it('times out while the body is still downloading', async () => {
    jest.useFakeTimers();
    const fetchImpl = jest.fn(async (_url: unknown, init?: RequestInit) => {
      const response = jsonResponse(pageWith([]));
      response.json = () =>
        new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
      return response;
    });

    const assertion = expectFailure(fetchEarnedAwards('elliematthewman', { fetchImpl }), 'UPSTREAM_UNAVAILABLE');
    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    expect((await assertion).message).toBe('Trailhead timed out');
  });

  it('never puts the username in error messages or logs', async () => {
    const username = 'secret-username';
    const failures = [
      jsonResponse(notFound),
      jsonResponse(privateProfile),
      jsonResponse(nullAwardPage),
      new Response('', { status: 429 }),
      new Response('', { status: 503 }),
    ];
    for (const response of failures) {
      const error = await fetchEarnedAwards(username, { fetchImpl: respondWith(response) }).catch((e: Error) => e);
      expect((error as Error).message).not.toContain(username);
    }
    expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain(username);
  });
});
