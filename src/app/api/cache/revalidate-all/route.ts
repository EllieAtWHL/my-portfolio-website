import { NextResponse } from 'next/server';
import { revalidateAllCache } from '@/lib/data/cache-server';

export async function POST() {
  try {
    // Revalidate all cache tags
    const revalidatedTags = revalidateAllCache();

    return NextResponse.json({ 
      message: 'All caches revalidated successfully',
      revalidatedTags
    });
  } catch (error) {
    console.error('Error revalidating all caches:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate all caches' },
      { status: 500 }
    );
  }
}
