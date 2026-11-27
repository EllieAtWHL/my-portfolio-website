import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin-api';
import { createMatch, updateMatch, deleteMatch } from '@/lib/admin/services';
import { adminWriteRoute } from '@/lib/admin/services/route-handler';
import { fetchAllPaginated } from '@/lib/utils/paginate';

export const POST = adminWriteRoute(createMatch, 'Match created successfully');
export const PUT = adminWriteRoute(updateMatch, 'Match updated successfully');
export const DELETE = adminWriteRoute(deleteMatch, 'Match deleted successfully');

export async function GET() {
  try {
    // Paginated so this list can't be silently truncated at PostgREST's 1000-row
    // response cap once the table grows past it (WEB-168) - see fetchAllPaginated.
    const { data, error } = await fetchAllPaginated((from, to) =>
      supabaseAdmin
        .from('matches_with_stadium')
        .select(`
          *,
          spurs_score_aet,
          opponent_score_aet,
          spurs_score_pens,
          opponent_score_pens
        `)
        .order('date', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to)
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
