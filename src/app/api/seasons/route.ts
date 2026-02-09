import { NextResponse } from 'next/server';
import { getSeasonsWithMatchCounts } from '@/lib/data/seasons';

export async function GET() {
  try {
    const seasons = await getSeasonsWithMatchCounts();
    
    return NextResponse.json({ 
      seasons,
      count: seasons.length 
    });
  } catch (error) {
    console.error('Error in seasons API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seasons', seasons: [] },
      { status: 500 }
    );
  }
}
