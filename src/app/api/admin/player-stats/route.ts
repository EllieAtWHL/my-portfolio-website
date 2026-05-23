import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';

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
    
    return NextResponse.json(handleApiSuccess(data, 'Player stats created successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}

export async function GET() {
  try {
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
