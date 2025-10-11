import { NextResponse } from 'next/server'
import { generateAuthUrl } from '@/lib/lastfm'

export async function GET() {
  try {
    const callbackUrl = `${process.env.BETTER_AUTH_URL}/api/lastfm/callback`
    const authUrl = generateAuthUrl(callbackUrl)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error generating Last.fm auth URL:', error)
    return NextResponse.json({ error: 'Failed to connect to Last.fm' }, { status: 500 })
  }
}
