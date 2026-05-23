import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin.from('stadium_names').insert(body).select();
    
    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to create stadium name'), { status: 400 });
    }
    
    return NextResponse.json(handleApiSuccess(data, 'Stadium name created successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
