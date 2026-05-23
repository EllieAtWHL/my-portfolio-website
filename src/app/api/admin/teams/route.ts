import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin.from('teams').insert(body).select();
    
    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to create team'), { status: 400 });
    }
    
    return NextResponse.json(handleApiSuccess(data, 'Team created successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('teams')
      .select('*')
      .order('name');
    
    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to fetch teams'), { status: 400 });
    }
    
    return NextResponse.json(handleApiSuccess(data));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
