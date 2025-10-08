import { cookies } from 'next/headers'
import { errorResponse, successResponse } from '@/lib/server/response-helpers'
import { CONFIG } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const cookieStore = await cookies()

    cookieStore.delete(CONFIG.auth.cookieName)

    return successResponse({ message: 'Logout successful' })
  } catch (error) {
    let errorMessage = 'An unexpected error occurred during logout.'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Error in /api/logout route handler:', error)
    return errorResponse(errorMessage)
  }
}
