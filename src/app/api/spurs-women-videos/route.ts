import { NextResponse } from 'next/server';
import { fetchSpursWomenVideos } from '../../../lib/rss';

export async function GET() {
  try {
    const videos = await fetchSpursWomenVideos();
    
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
