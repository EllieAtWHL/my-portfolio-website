import { NextResponse } from 'next/server';
import { revalidateAllCache } from '@/lib/data/cache-server';

// Simple API key authentication for cache operations
function validateApiKey(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedKey = `Bearer ${process.env.CACHE_API_KEY || 'default-cache-key-for-dev'}`;
  
  if (!authHeader || authHeader !== expectedKey) {
    console.warn('Unauthorized cache revalidation-all attempt', {
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
    return false;
  }
  
  return true;
}

export async function POST(request: Request) {
  // Validate API key first
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing API key' },
      { status: 401 }
    );
  }

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
