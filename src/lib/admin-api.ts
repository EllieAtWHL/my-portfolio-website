import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for admin operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Generic API response handler
export function handleApiError(error: any, defaultMessage: string = 'Operation failed') {
  console.error('Admin API error:', error);
  return {
    error: error?.message || defaultMessage,
    code: error?.code || 'UNKNOWN_ERROR'
  };
}

export function handleApiSuccess(data: any, message: string = 'Operation successful') {
  return {
    data,
    message,
    success: true
  };
}
