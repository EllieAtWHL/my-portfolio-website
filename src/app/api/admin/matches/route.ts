import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin-api';
import { invalidateMatchCache, invalidateStadiumCache } from '@/lib/data/cache-invalidation';
import { fetchAllPaginated } from '@/lib/utils/paginate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error: insertError } = await supabaseAdmin.from('matches').insert(body).select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    invalidateMatchCache();
    // Saving a match at a Groundhopper-only ground promotes it to a Spurs
    // Women ground (WEB-224 trigger), so stadium pages and lists change too.
    invalidateStadiumCache();
    return NextResponse.json({ data, message: 'Match created successfully' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('matches')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    invalidateMatchCache();
    // Saving a match at a Groundhopper-only ground promotes it to a Spurs
    // Women ground (WEB-224 trigger), so stadium pages and lists change too.
    invalidateStadiumCache();
    return NextResponse.json({ data, message: 'Match updated successfully' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('matches').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    invalidateMatchCache();
    return NextResponse.json({ success: true, message: 'Match deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
