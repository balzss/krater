import { NextRequest, NextResponse } from 'next/server'
import { fetchUserInfo } from '@/lib/lastfm'

export async function GET(request: NextRequest) {
  try {
    // Get session key from cookie
    const sessionKey = request.cookies.get('lastfm-session-key')?.value

    if (!sessionKey) {
      return NextResponse.json({ user: null })
    }

    // Fetch user info from Last.fm
    const user = await fetchUserInfo(sessionKey)

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching Last.fm user:', error)
    return NextResponse.json({ error: 'Failed to fetch user info' }, { status: 500 })
  }
}
