import { NextRequest, NextResponse } from 'next/server';
import { revalidateCacheTags } from '@/lib/data/cache-server';
import { CACHE_TAGS } from '@/lib/data';

// Simple API key authentication for cache operations
function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cacheApiKey = process.env.CACHE_API_KEY;
  
  // Fail securely - no default fallback for production safety
  if (!cacheApiKey) {
    console.error('CACHE_API_KEY environment variable is not set');
    return false;
  }
  
  const expectedKey = `Bearer ${cacheApiKey}`;
  
  if (!authHeader || authHeader !== expectedKey) {
    console.warn('Unauthorized cache revalidation attempt', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
    return false;
  }
  
  return true;
}

export async function POST(request: NextRequest) {
  // Validate API key first
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing API key' },
      { status: 401 }
    );
  }

  try {
    const { tags } = await request.json();
    
    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Invalid request: tags array is required' },
        { status: 400 }
      );
    }

    // Validate tags
    const validTags = Object.values(CACHE_TAGS);
    const invalidTags = tags.filter(tag => !validTags.includes(tag));
    
    if (invalidTags.length > 0) {
      return NextResponse.json(
        { error: `Invalid cache tags: ${invalidTags.join(', ')}` },
        { status: 400 }
      );
    }

    // Revalidate the specified cache tags
    revalidateCacheTags(tags);

    return NextResponse.json({ 
      message: 'Cache revalidated successfully',
      revalidatedTags: tags
    });
  } catch (error) {
    console.error('Error revalidating cache:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate cache' },
      { status: 500 }
    );
  }
}
