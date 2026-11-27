import { NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError } from '@/lib/admin-api';
import { createPlayerStats, updatePlayerStats, deletePlayerStats } from '@/lib/admin/services';
import { adminWriteRoute } from '@/lib/admin/services/route-handler';
import { fetchAllPaginated } from '@/lib/utils/paginate';

export const POST = adminWriteRoute(createPlayerStats, 'Player stats created successfully');
export const PUT = adminWriteRoute(updatePlayerStats, 'Player stats updated successfully');
export const DELETE = adminWriteRoute(deletePlayerStats, 'Player stats deleted successfully');

export async function GET() {
  try {
    // player_stats has grown past PostgREST's 1000-row response cap, which was
    // silently truncating this GET (WEB-167) - see fetchAllPaginated for why/how.
    // Ordered by created_at then id (not created_at alone): POST above can upsert
    // an entire match's rows in one call, giving them an identical created_at, and
    // an unbroken tie at a page boundary could otherwise skip or duplicate a row
    // within that single read.
    const { data, error } = await fetchAllPaginated((from, to) =>
      supabaseAdmin
        .from('player_stats')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to)
    );

    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to fetch player stats'), { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
