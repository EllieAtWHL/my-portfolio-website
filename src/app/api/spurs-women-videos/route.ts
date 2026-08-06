import { NextRequest, NextResponse } from 'next/server';
import { getSpursWomenVideos } from '@/lib/data';
import { rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimited = rateLimitResponse(request, {
    routeKey: 'spurs-women-videos',
    limit: 30,
    windowSeconds: 60,
  });
  if (rateLimited) {
    return rateLimited;
  }

  try {
    const videos = await getSpursWomenVideos();

    return NextResponse.json({
      videos,
      count: videos.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in spurs-women-videos API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch videos',
        videos: [],
        count: 0
      },
      { status: 500 }
    );
  }
}
