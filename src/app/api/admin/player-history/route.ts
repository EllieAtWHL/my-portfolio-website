import { NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError } from '@/lib/admin-api';
import { createPlayerHistory, updatePlayerHistory, deletePlayerHistory } from '@/lib/admin/services';
import { adminWriteRoute } from '@/lib/admin/services/route-handler';
import { fetchAllPaginated } from '@/lib/utils/paginate';

export const POST = adminWriteRoute(createPlayerHistory, 'Player history created successfully');
export const PUT = adminWriteRoute(updatePlayerHistory, 'Player history updated successfully');
export const DELETE = adminWriteRoute(deletePlayerHistory, 'Player history deleted successfully');

export async function GET() {
  try {
    // Paginated so this list can't be silently truncated at PostgREST's 1000-row
    // response cap once the table grows past it (WEB-168) - see fetchAllPaginated.
    const { data, error } = await fetchAllPaginated((from, to) =>
      supabaseAdmin
        .from('player_history')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to)
    );
    
    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to fetch player history'), { status: 400 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
