import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { errorResponse, successResponse } from '@/lib/server/response-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (session) {
      return successResponse({ isAdmin: true, user: session.user })
    }

    return successResponse({ isAdmin: false })
  } catch (error) {
    let errorMessage = 'Internal Server Error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Error in /api/auth/me route handler:', error)
    return errorResponse(errorMessage, 500, { isAdmin: false })
  }
}
