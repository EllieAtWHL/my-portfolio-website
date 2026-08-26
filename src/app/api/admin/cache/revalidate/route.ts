import { NextResponse } from 'next/server';
import { revalidateAllCache } from '@/lib/data';
import { handleApiError, handleApiSuccess } from '@/lib/admin-api';

export async function POST() {
  try {
    const revalidatedTags = revalidateAllCache();
    return NextResponse.json(handleApiSuccess({ revalidatedTags }, 'Cache invalidated successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Failed to invalidate cache'), { status: 500 });
  }
}
