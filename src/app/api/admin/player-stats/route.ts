import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';
import { invalidatePlayerStatsCache } from '@/lib/data/cache-invalidation';
import { fetchAllPaginated } from '@/lib/utils/paginate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseAdmin.from('player_stats').upsert(body, {
      onConflict: 'player_id, match_id',
      ignoreDuplicates: false
    }).select();

    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to create player stats'), { status: 400 });
    }

    invalidatePlayerStatsCache();
    return NextResponse.json(handleApiSuccess(data, 'Player stats created successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}

export async function GET() {
  try {
    // PostgREST caps a single response at 1000 rows. player_stats already exceeds
    // that (WEB-167 - it was silently truncating this GET to the 1000
    // most-recently-created rows, hiding older records from every admin
    // related-stats list), so page past it with fetchAllPaginated - the same
    // helper fetchPlayerStatsAggregateForTeam (src/lib/data/teams.ts) uses for the
    // public-facing career-stats aggregate on this same table.
    // Ordered by created_at then id (not created_at alone): POST above can upsert
    // an entire match's rows in one call, giving them an identical created_at, and
    // an unbroken tie at a page boundary could otherwise skip or duplicate a row
    // across two .range() pages.
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('player_stats')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to update player stats'), { status: 400 });
    }

    invalidatePlayerStatsCache();
    return NextResponse.json(handleApiSuccess(data, 'Player stats updated successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('player_stats').delete().eq('id', id);

    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to delete player stats'), { status: 400 });
    }

    invalidatePlayerStatsCache();
    return NextResponse.json({ success: true, message: 'Player stats deleted successfully' });
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
