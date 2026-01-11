import { NextResponse } from 'next/server';
import { fetchSpursWomenNews } from '../../../lib/rss';

export async function GET() {
  try {
    const news = await fetchSpursWomenNews();
    return NextResponse.json({ news });
  } catch (error) {
    console.error('Error in Spurs women news API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Spurs women news' },
      { status: 500 }
    );
  }
}
