import { NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';
import { createStadium, updateStadium, deleteStadium } from '@/lib/admin/services';
import { adminWriteRoute } from '@/lib/admin/services/route-handler';
import { fetchAllPaginated } from '@/lib/utils/paginate';

export const POST = adminWriteRoute(createStadium, 'Stadium created successfully');
export const PUT = adminWriteRoute(updateStadium, 'Stadium updated successfully');
export const DELETE = adminWriteRoute(deleteStadium, 'Stadium deleted successfully');

export async function GET() {
  try {
    // Paginated so this list can't be silently truncated at PostgREST's 1000-row
    // response cap once the table grows past it (WEB-168) - see fetchAllPaginated.
    const { data, error } = await fetchAllPaginated((from, to) =>
      supabaseAdmin
        .from('stadia')
        .select('*')
        .order('name')
        .order('id', { ascending: true })
        .range(from, to)
    );
    
    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to fetch stadiums'), { status: 400 });
    }
    
    return NextResponse.json(handleApiSuccess(data));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
