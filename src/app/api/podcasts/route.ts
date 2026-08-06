import { NextRequest, NextResponse } from 'next/server';
import { getPodcasts } from '@/lib/data';
import { rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimited = rateLimitResponse(request, {
    routeKey: 'podcasts',
    limit: 30,
    windowSeconds: 60,
  });
  if (rateLimited) {
    return rateLimited;
  }

  try {
    const episodes = await getPodcasts();
    return NextResponse.json({ episodes });
  } catch (error) {
    console.error('Error in podcasts API route:', error);
    return NextResponse.json({ error: 'Failed to fetch podcasts' }, { status: 500 });
  }
}
