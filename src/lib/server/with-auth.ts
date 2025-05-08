import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

type RouteHandler = (
  req: NextRequest,
  params?: { [key: string]: string | string[] }
) => Promise<NextResponse>

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, params?: { [key: string]: string | string[] }) => {
    // const isDevelopment = process.env.NODE_ENV === 'development'
    const isDevelopment = false

    if (!isDevelopment) {
      // Only apply auth if NOT in development
      try {
        const cookieStore = await cookies()
        const adminSessionCookie = cookieStore.get('admin-session')

        if (!adminSessionCookie || adminSessionCookie.value !== 'true') {
          return NextResponse.json(
            { message: 'Unauthorized: Admin access required.' },
            { status: 401 }
          )
        }
      } catch (error) {
        // This catch block is for errors during the cookie retrieval itself.
        console.error('Error during authentication check:', error)
        return NextResponse.json({ message: 'Authentication error.' }, { status: 500 })
      }
    }

    // If authentication is successful (or skipped), call the original handler
    return handler(req, params)
  }
}
