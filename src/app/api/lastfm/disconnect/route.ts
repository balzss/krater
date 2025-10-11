import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })

    // Delete the cookie
    response.cookies.delete('lastfm-session-key')

    return response
  } catch (error) {
    console.error('Error disconnecting Last.fm:', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
