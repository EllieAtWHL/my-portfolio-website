import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';
import { invalidateTeamCache } from '@/lib/data/cache-invalidation';
import { fetchAllPaginated } from '@/lib/utils/paginate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseAdmin.from('teams').insert(body).select();

    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to create team'), { status: 400 });
    }

    invalidateTeamCache();
    return NextResponse.json(handleApiSuccess(data, 'Team created successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}

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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('teams')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to update team'), { status: 400 });
    }

    invalidateTeamCache();
    return NextResponse.json(handleApiSuccess(data, 'Team updated successfully'));
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

    const { error } = await supabaseAdmin.from('teams').delete().eq('id', id);

    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to delete team'), { status: 400 });
    }

    invalidateTeamCache();
    return NextResponse.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
