import { NextResponse } from 'next/server';
import { getUpcomingMatches } from '@/lib/data/matches';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3');
    
    const matches = await getUpcomingMatches(limit);
    
    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Error in upcoming matches API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming matches', matches: [] },
      { status: 500 }
    );
  }
}
