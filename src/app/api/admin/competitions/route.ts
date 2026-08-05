import { NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('competitions')
      .select('*')
      .order('name');
    
    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to fetch competitions'), { status: 400 });
    }
    
    return NextResponse.json(handleApiSuccess(data));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
