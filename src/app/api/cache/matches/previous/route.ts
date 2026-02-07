import { NextResponse } from 'next/server';
import { getPreviousMatches } from '@/lib/data/matches';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3');
    
    const matches = await getPreviousMatches(limit);
    
    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Error in previous matches API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch previous matches', matches: [] },
      { status: 500 }
    );
  }
}
