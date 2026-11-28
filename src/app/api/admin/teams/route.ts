import { NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';
import { createTeam, updateTeam, deleteTeam } from '@/lib/admin/services';
import { adminWriteRoute } from '@/lib/admin/services/route-handler';
import { fetchAllPaginated } from '@/lib/utils/paginate';

export const POST = adminWriteRoute(createTeam, 'Team created successfully');
export const PUT = adminWriteRoute(updateTeam, 'Team updated successfully');
export const DELETE = adminWriteRoute(deleteTeam, 'Team deleted successfully');

export async function GET() {
  try {
    // Paginated so this list can't be silently truncated at PostgREST's 1000-row
    // response cap once the table grows past it (WEB-168) - see fetchAllPaginated.
    const { data, error } = await fetchAllPaginated((from, to) =>
      supabaseAdmin
        .from('teams')
        .select('*')
        .order('name')
        .order('id', { ascending: true })
        .range(from, to)
    );
    
    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to fetch teams'), { status: 400 });
    }
    
    return NextResponse.json(handleApiSuccess(data));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
