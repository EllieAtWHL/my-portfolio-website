/**
 * Fake Trailhead profile GraphQL endpoint for src/lib/trailhead tests, serving
 * WEB-230's recorded fixtures (src/lib/trailhead/__tests__/fixtures/) by award
 * type and `after` cursor, the way the real keyset pagination does. A request
 * for a page that wasn't recorded fails the test loudly.
 *
 * Usage:
 *   const fetchImpl = fakeTrailheadFetch();               // Ellie's recorded profile
 *   const fetchImpl = fakeTrailheadFetch({ EVENT: [page] }); // custom pages
 *   const fetchImpl = respondWith(new Response('…', { status: 503 }));
 */
import eventPage1 from '@/lib/trailhead/__tests__/fixtures/event-page-1.json';
import eventPage2 from '@/lib/trailhead/__tests__/fixtures/event-page-2.json';
import eventPage3 from '@/lib/trailhead/__tests__/fixtures/event-page-3.json';
import modulePage1 from '@/lib/trailhead/__tests__/fixtures/module-page-1.json';
import modulePage2 from '@/lib/trailhead/__tests__/fixtures/module-page-2.json';

// Just enough shape to follow the cursor chain; pages are served as-is.
export interface FixturePage {
  data: { profile: { earnedAwards: { pageInfo: { endCursor: string | null } } } };
}

export const RECORDED_PAGES: Record<string, FixturePage[]> = {
  EVENT: [eventPage1, eventPage2, eventPage3],
  MODULE: [modulePage1, modulePage2],
};

export interface TrailheadRequest {
  slug: string;
  count: number;
  after: string | null;
  filter: string;
}

export function requestVariables(fetchImpl: jest.Mock): TrailheadRequest[] {
  return fetchImpl.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string).variables);
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export function fakeTrailheadFetch(pages: Record<string, FixturePage[]> = RECORDED_PAGES): jest.Mock {
  return jest.fn(async (_url: string, init: RequestInit) => {
    const { filter, after } = JSON.parse(init.body as string).variables as TrailheadRequest;
    const typePages = pages[filter] ?? [];
    const index =
      after === null
        ? 0
        : typePages.findIndex((page) => page.data.profile.earnedAwards.pageInfo.endCursor === after) + 1;
    if (index < 0 || index >= typePages.length || (after !== null && index === 0)) {
      throw new Error(`No recorded ${filter} page after cursor ${after}`);
    }
    return jsonResponse(typePages[index]);
  });
}

export function respondWith(...responses: Array<Response | Error>): jest.Mock {
  const fn = jest.fn();
  responses.forEach((response) =>
    response instanceof Error ? fn.mockRejectedValueOnce(response) : fn.mockResolvedValueOnce(response)
  );
  return fn;
}

/** A copy of a recorded page with its awards replaced, for building edge cases. */
export function pageWith(
  awards: Array<{ id: string; title: string; type: string } | null>,
  pageInfo: { hasNextPage: boolean; endCursor: string | null } = { hasNextPage: false, endCursor: null }
) {
  return {
    data: {
      profile: {
        __typename: 'PublicProfile',
        name: 'Test Trailblazer',
        avatarUrl: 'https://example.com/avatar.png',
        earnedAwards: {
          edges: awards.map((award, i) => ({
            node: {
              __typename: 'EarnedAwardBase',
              id: `earned-${i}`,
              award: award && { ...award, icon: `https://example.com/${award.id}.png`, content: null },
            },
          })),
          pageInfo,
        },
      },
    },
  };
}
