import { NextResponse } from 'next/server';
import { supabaseAdmin, handleApiError } from '@/lib/admin-api';
import { createStadiumName, updateStadiumName, deleteStadiumName } from '@/lib/admin/services';
import { adminWriteRoute } from '@/lib/admin/services/route-handler';

export const POST = adminWriteRoute(createStadiumName, 'Stadium name created successfully');
export const PUT = adminWriteRoute(updateStadiumName, 'Stadium name updated successfully');
export const DELETE = adminWriteRoute(deleteStadiumName, 'Stadium name deleted successfully');

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('stadium_names')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json(handleApiError(error, 'Failed to fetch stadium names'), { status: 400 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Internal server error'), { status: 500 });
  }
}
