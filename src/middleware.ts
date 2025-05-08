import { NextRequest, NextResponse } from 'next/server'

async function verifyAdminSession(req: NextRequest): Promise<boolean> {
  const adminSessionCookie = req.cookies.get('admin-session')
  return adminSessionCookie?.value === 'true'
}

export async function middleware(req: NextRequest) {
  const isDevelopment = false

  if (!isDevelopment) {
    try {
      const isAdmin = await verifyAdminSession(req)

      if (!isAdmin) {
        return NextResponse.json(
          { message: 'Unauthorized: Admin access required.' },
          { status: 401 }
        )
      }
    } catch (error) {
      console.error('Error during authentication check in middleware:', error)
      return NextResponse.json({ message: 'Authentication error.' }, { status: 500 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/health'],
}
