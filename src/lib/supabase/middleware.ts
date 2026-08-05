import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rateLimitResponse } from '@/lib/rate-limit'

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/spurs-women/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/spurs-women/login'
      return NextResponse.redirect(url)
    }

    // Check if user is authorized admin
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || user.email !== adminEmail) {
      const url = request.nextUrl.clone()
      url.pathname = '/spurs-women/unauthorised'
      return NextResponse.redirect(url)
    }
  }

  // Protect admin API routes. Centralized here (rather than duplicated per
  // route handler) so a new /api/admin/* route can't ship without auth by
  // omission - that's exactly how two routes ended up unprotected before
  // (see WEB-70 security audit).
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // CSRF guard: these routes authenticate via cookies, which browsers attach
    // automatically even to cross-site requests. Browsers always send Origin on
    // state-changing (non-GET/HEAD) fetch/XHR requests, same-origin or not, so
    // requiring it to match our own origin blocks cross-site form/fetch forgery
    // without needing a separate CSRF token.
    if (!['GET', 'HEAD'].includes(request.method)) {
      const origin = request.headers.get('origin')
      if (!origin || origin !== request.nextUrl.origin) {
        return NextResponse.json({ error: 'Forbidden: cross-origin request rejected' }, { status: 403 })
      }
    }

    // Generous cap (single trusted admin) purely to stop a runaway script or
    // buggy client-side loop from hammering the database, not to throttle
    // normal admin usage.
    const rateLimited = rateLimitResponse(request, {
      routeKey: 'api-admin',
      limit: 120,
      windowSeconds: 60,
    })
    if (rateLimited) {
      return rateLimited
    }
  }

  // Protect profile routes (requires authentication but not admin)
  if (request.nextUrl.pathname.startsWith('/spurs-women/profile')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/spurs-women/login'
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally: return myNewResponse
  // Otherwise, the user session will not be updated correctly!

  return supabaseResponse
}
