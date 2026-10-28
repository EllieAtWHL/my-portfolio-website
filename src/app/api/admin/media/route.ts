import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';
import { invalidateMediaCache } from '@/lib/data/cache-invalidation';
import { fetchAllPaginated } from '@/lib/utils/paginate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseAdmin.from('media').insert(body).select();

    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to create media'), { status: 400 });
    }

    invalidateMediaCache();
    return NextResponse.json(handleApiSuccess(data, 'Media created successfully'));
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('media')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to update media'), { status: 400 });
    }

    invalidateMediaCache();
    return NextResponse.json(handleApiSuccess(data, 'Media updated successfully'));
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

    const { error } = await supabaseAdmin.from('media').delete().eq('id', id);

    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to delete media'), { status: 400 });
    }

    invalidateMediaCache();
    return NextResponse.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
