import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin.from('players').insert(body).select();
    
    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to create player'), { status: 400 });
    }
    
    return NextResponse.json(handleApiSuccess(data, 'Player created successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('players')
      .select('*')
      .order('last_name');
    
    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to fetch players'), { status: 400 });
    }
    
    return NextResponse.json(handleApiSuccess(data));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
