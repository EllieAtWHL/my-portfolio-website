import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    const { data, error } = await supabaseAdmin.from('player_stats').upsert(body, {
      onConflict: 'player_id, match_id',
      ignoreDuplicates: false
    }).select();
    
    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to create player stats'), { status: 400 });
    }
    
    return NextResponse.json(handleApiSuccess(data, 'Player stats created successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('player_stats')
      .select('*')
      .order('created_at', { ascending: false });
    
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
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    return NextResponse.json(handleApiSuccess(data, 'Player stats updated successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('player_stats').delete().eq('id', id);

    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to delete player stats'), { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Player stats deleted successfully' });
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
