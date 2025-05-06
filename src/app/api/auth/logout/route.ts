import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-static'

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSessionCookie = cookieStore.get('admin-session')

    if (adminSessionCookie && adminSessionCookie.value === 'true') {
      return Response.json({ isAdmin: true }, { status: 200 })
    }

    return Response.json({ isAdmin: false }, { status: 200 })
  } catch (error) {
    let errorMessage = 'Internal Server Error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Error in /api/me route handler:', error)
    return Response.json({ message: errorMessage, isAdmin: false }, { status: 500 })
  }
}
