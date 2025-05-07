import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server' // Using NextRequest for easier body parsing

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret) {
      console.error('ADMIN_SECRET is not set in environment variables.')
      return Response.json(
        { message: 'Configuration error: Admin secret not set.' },
        { status: 500 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error(parseError)
      return Response.json({ message: 'Invalid JSON body' }, { status: 400 })
    }

    const { secret } = body

    if (typeof secret !== 'string') {
      return Response.json({ message: 'Secret must be a string.' }, { status: 400 })
    }

    // Check if the provided secret matches the admin secret
    if (secret === adminSecret) {
      // If the secret is correct, set an HTTP-only cookie
      const cookieStore = await cookies()
      cookieStore.set('admin-session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/', // Cookie available for all paths
        maxAge: 60 * 60 * 24 * 7, // Example: 1 week in seconds
        sameSite: 'strict', // Helps prevent CSRF attacks
      })

      return Response.json({ success: true, isAdmin: true }, { status: 200 })
    } else {
      return Response.json({ message: 'Invalid secret' }, { status: 401 })
    }
  } catch (error) {
    let errorMessage = 'An unexpected error occurred during login.'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Error in /api/login route handler:', error)
    return Response.json({ message: errorMessage }, { status: 500 })
  }
}
