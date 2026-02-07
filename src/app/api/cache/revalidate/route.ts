import { NextRequest, NextResponse } from 'next/server';
import { revalidateCacheTags } from '@/lib/data/cache-server';
import { CACHE_TAGS } from '@/lib/data';

export async function POST(request: NextRequest) {
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
