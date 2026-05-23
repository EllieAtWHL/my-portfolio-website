import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError, handleApiSuccess } from '@/lib/admin-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin.from('media').insert(body).select();
    
    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to create media'), { status: 400 });
    }
    
    return NextResponse.json(handleApiSuccess(data, 'Media created successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to fetch media'), { status: 400 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
