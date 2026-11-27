import { NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError } from '@/lib/admin-api';
import { createMedia, updateMedia, deleteMedia } from '@/lib/admin/services';
import { adminWriteRoute } from '@/lib/admin/services/route-handler';
import { fetchAllPaginated } from '@/lib/utils/paginate';

export const POST = adminWriteRoute(createMedia, 'Media created successfully');
export const PUT = adminWriteRoute(updateMedia, 'Media updated successfully');
export const DELETE = adminWriteRoute(deleteMedia, 'Media deleted successfully');

export async function GET() {
  try {
    // Paginated so this list can't be silently truncated at PostgREST's 1000-row
    // response cap once the table grows past it (WEB-168) - see fetchAllPaginated.
    const { data, error } = await fetchAllPaginated((from, to) =>
      supabaseAdmin
        .from('media')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to)
    );

    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to fetch media'), { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
