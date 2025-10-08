import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server' // Using NextRequest for easier body parsing
import { CONFIG } from '@/lib/constants'
import { errorResponse, successResponse } from '@/lib/server/response-helpers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret) {
      console.error('ADMIN_SECRET is not set in environment variables.')
      return errorResponse('Configuration error: Admin secret not set.')
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error(parseError)
      return errorResponse('Invalid JSON body', 400)
    }

    const { secret } = body

    if (typeof secret !== 'string') {
      return errorResponse('Secret must be a string.', 400)
    }

    // Check if the provided secret matches the admin secret
    if (secret === adminSecret) {
      // If the secret is correct, set an HTTP-only cookie
      const cookieStore = await cookies()
      cookieStore.set(CONFIG.auth.cookieName, 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/', // Cookie available for all paths
        maxAge: CONFIG.auth.cookieMaxAge,
        sameSite: 'strict', // Helps prevent CSRF attacks
      })

      return successResponse({ success: true, isAdmin: true })
    } else {
      return errorResponse('Invalid secret', 401)
    }
  } catch (error) {
    let errorMessage = 'An unexpected error occurred during login.'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Error in /api/login route handler:', error)
    return errorResponse(errorMessage)
  }
}
