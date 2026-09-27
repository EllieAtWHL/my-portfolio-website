import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // Only these prefixes actually consume the session `user` inside
  // updateSession (admin auth, admin API auth/CSRF/rate-limit, profile auth).
  // Running it on every other route pays for a Supabase auth revalidation
  // call on page loads that never use the result - see WEB-176.
  matcher: ['/spurs-women/admin/:path*', '/api/admin/:path*', '/spurs-women/profile/:path*'],
}
