import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware for CORS and basic request handling
 *
 * Note: Authentication is handled in individual API routes, not middleware.
 * This is because Better Auth with SQLite requires Node.js runtime,
 * but Next.js middleware must run in Edge runtime.
 */
export async function middleware(_req: NextRequest) {
  // Allow all requests to pass through
  // Authentication will be checked in each protected API route
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
