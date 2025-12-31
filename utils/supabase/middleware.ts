import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isPWAStandaloneServer } from '@/lib/utils/pwa'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // PWA Mode Detection and Routing
  // When the app is opened in PWA/standalone mode, we want to skip the landing page
  // and go directly to the app experience (dashboard if authenticated, login if not)
  const isPWA = isPWAStandaloneServer(
    request.headers.get('user-agent'),
    request.headers.get('sec-ch-ua-mode')
  )

  // Check if this is a request to the root path in PWA mode
  // Note: Server-side PWA detection is less reliable, so we also check for
  // a custom header that can be set by the client, or rely on client-side redirect
  const isRootPath = request.nextUrl.pathname === '/'
  const pwaHeader = request.headers.get('x-pwa-mode') // Can be set by client for more reliable detection

  // If we're in PWA mode (or have the PWA header) and on the root path, redirect appropriately
  if ((isPWA || pwaHeader === 'true') && isRootPath) {
    if (user) {
      // User is authenticated - redirect to dashboard
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      // Create new response with redirect, preserving cookies
      const redirectResponse = NextResponse.redirect(url)
      // Copy all cookies from supabaseResponse to maintain session
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    } else {
      // User is not authenticated - redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      // Create new response with redirect, preserving cookies
      const redirectResponse = NextResponse.redirect(url)
      // Copy all cookies from supabaseResponse to maintain session
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }
  }

  const publicPaths = ['/signup','/login', '/auth', '/verify-email', '/error', '/', '/debug-oauth', '/check-email', '/check-email-simple', '/test-email', '/test-signup', '/signup-fixed', '/test-signup-debug', '/check-database', '/test-signup-simple', '/test-supabase', '/check-supabase-status', '/test-project-status', '/test-signup-no-plan', '/test-signup-minimal'];

  if (
    !user &&
    !publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}