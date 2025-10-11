import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Check if the request has a valid Better Auth session
 * Returns the session if valid, otherwise returns an unauthorized response
 */
export async function requireAuth(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return {
        session: null,
        response: NextResponse.json(
          { error: 'Unauthorized: Authentication required' },
          { status: 401 }
        ),
      }
    }

    return { session, response: null }
  } catch (error) {
    console.error('Auth check error:', error)
    return {
      session: null,
      response: NextResponse.json({ error: 'Authentication error' }, { status: 500 }),
    }
  }
}
