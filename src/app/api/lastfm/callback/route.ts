import { NextResponse } from 'next/server'
import { getLastFmSession } from '@/lib/lastfm'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(`${process.env.BETTER_AUTH_URL}/settings?lastfm_error=no_token`)
    }

    // Exchange token for session key
    const sessionKey = await getLastFmSession(token)

    // Create redirect response and set cookie
    const response = NextResponse.redirect(
      `${process.env.BETTER_AUTH_URL}/settings?lastfm_success=true`
    )

    // Set cookie in response headers
    response.cookies.set('lastfm-session-key', sessionKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year (Last.fm sessions don't expire)
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error in Last.fm callback:', error)
    return NextResponse.redirect(`${process.env.BETTER_AUTH_URL}/settings?lastfm_error=auth_failed`)
  }
}
