import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/lib/server/response-helpers'
import { CONFIG } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSessionCookie = cookieStore.get(CONFIG.auth.cookieName)

    if (adminSessionCookie && adminSessionCookie.value === 'true') {
      return successResponse({ isAdmin: true })
    }

    return successResponse({ isAdmin: false })
  } catch (error) {
    let errorMessage = 'Internal Server Error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Error in /api/me route handler:', error)
    return errorResponse(errorMessage, 500, { isAdmin: false })
  }
}
