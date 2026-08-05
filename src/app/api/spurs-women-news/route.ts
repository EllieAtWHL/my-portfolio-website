import { NextRequest, NextResponse } from 'next/server';
import { getSpursWomenNews } from '@/lib/data';
import { rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimited = rateLimitResponse(request, {
    routeKey: 'spurs-women-news',
    limit: 30,
    windowSeconds: 60,
  });
  if (rateLimited) {
    return rateLimited;
  }

  try {
    const news = await getSpursWomenNews();
    return NextResponse.json({ news });
  } catch (error) {
    console.error('Error in Spurs women news API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Spurs women news' },
      { status: 500 }
    );
  }
}
