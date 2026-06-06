import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimitMiddleware } from './middleware/rate-limit'
import { addSecurityHeaders } from './middleware/security-headers'

// Protected routes that require authentication
const protectedRoutes = [
  '/tree',
  '/media',
  '/timeline',
  '/stories',
  '/analytics',
  '/search',
  '/members',
  '/submit',
  '/admin',
]

// Public routes that don't require authentication
const publicRoutes = ['/', '/auth']

export async function proxy(request: NextRequest) {
  // 1. Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request)
  if (rateLimitResponse.status === 429) {
    return rateLimitResponse
  }

  // 2. Update session (Supabase)
  let response = await updateSession(request)
  
  // 3. Auth checks and route protection
  const pathname = request.nextUrl.pathname
  
  // Skip auth checks for static assets and next assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return addSecurityHeaders(request, response)
  }

  // Check if route is protected
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublic = publicRoutes.includes(pathname)

  if (isProtected || (!isPublic && !pathname.includes('.'))) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return addSecurityHeaders(request, response)
    }

    // TEMP BYPASS: Commenting out the redirect to /auth because authentication is currently unstable.
    // This allows the app to load even if the user is not authenticated.
    /*
    const authToken = request.cookies.get('sb-access-token')?.value
    if (!authToken && !isPublic) {
      // Redirect to auth page
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    */
    console.log('Proxy: Auth bypass active for', pathname)
  }

  // 4. Apply security headers
  return addSecurityHeaders(request, response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
