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
export function handleApiError(error: unknown, defaultMessage: string = 'Operation failed') {
  console.error('Admin API error:', error);
  return {
    error: (error as Error)?.message || defaultMessage,
    code: (error as { code?: string })?.code || 'UNKNOWN_ERROR'
  };
}

export function handleApiSuccess(data: unknown, message: string = 'Operation successful') {
  return {
    data,
    message,
    success: true
  };
}
