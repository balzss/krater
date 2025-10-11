import { cookies } from 'next/headers'

const SESSION_KEY_COOKIE = 'lastfm-session-key'

/**
 * Store Last.fm session key in encrypted cookie
 */
export async function storeLastFmSession(sessionKey: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_KEY_COOKIE, sessionKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year (Last.fm sessions don't expire)
  })
}

/**
 * Retrieve Last.fm session key from cookie
 */
export async function getLastFmSessionKey(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(SESSION_KEY_COOKIE)
  return cookie?.value || null
}

/**
 * Delete Last.fm session key cookie
 */
export async function deleteLastFmSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_KEY_COOKIE)
}
