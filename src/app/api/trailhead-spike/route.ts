// TEMPORARY (WEB-230 spike): proves the Trailhead profile GraphQL API works
// from Vercel and times a full cold lookup there. Never served in production,
// and removed before chore/WEB-230-trailhead-api-spike merges - the real route
// is built in WEB-231.
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ENDPOINT = 'https://profile.api.trailhead.com/graphql';
const QUERY = `query GetTrailheadBadges($slug: String, $count: Int, $after: String, $filter: AwardTypeFilter) {
  profile(slug: $slug) {
    __typename
    ... on PublicProfile {
      name
      avatarUrl
      earnedAwards(first: $count, after: $after, awardType: $filter) {
        edges { node { __typename id ... on EarnedAwardBase { award { id title type } } } }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}`;

type Edge = { node: { award: { id: string; title: string; type: string } | null } };

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const username = request.nextUrl.searchParams.get('u') || 'elliematthewman';
  const pageSize = Math.min(Number(request.nextUrl.searchParams.get('size')) || 50, 100);
  const started = Date.now();
  const report: Record<string, unknown> = { username, pageSize, region: process.env.VERCEL_REGION };

  for (const filter of ['EVENT', 'MODULE']) {
    let after: string | null = null;
    let pages = 0;
    let awards = 0;
    let nulls = 0;
    const pageMs: number[] = [];
    const trickOrTrailhead: string[] = [];

    while (true) {
      const pageStarted = Date.now();
      const response: Response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: QUERY, variables: { slug: username, count: pageSize, after, filter } }),
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      });
      pageMs.push(Date.now() - pageStarted);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- throwaway spike
      const body: any = await response.json();
      if (!response.ok || body.errors) {
        report[filter] = { status: response.status, errors: body.errors, pages };
        break;
      }
      if (body.data.profile.__typename !== 'PublicProfile') {
        report[filter] = { profileType: body.data.profile.__typename };
        break;
      }
      report.profile = { name: body.data.profile.name, hasAvatar: Boolean(body.data.profile.avatarUrl) };

      const connection: { edges: Edge[]; pageInfo: { hasNextPage: boolean; endCursor: string } } =
        body.data.profile.earnedAwards;
      pages++;
      for (const { node } of connection.edges as Edge[]) {
        awards++;
        if (!node.award) nulls++;
        else if (/trick or trailhead/i.test(node.award.title)) trickOrTrailhead.push(node.award.title.trim());
      }
      if (!connection.pageInfo.hasNextPage) {
        report[filter] = { pages, awards, nulls, totalMs: pageMs.reduce((a, b) => a + b, 0), pageMs, trickOrTrailhead };
        break;
      }
      after = connection.pageInfo.endCursor;
    }
  }

  report.totalMs = Date.now() - started;
  return NextResponse.json(report);
}
