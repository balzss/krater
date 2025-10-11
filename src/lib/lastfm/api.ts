import crypto from 'crypto'

export interface LastFmAlbum {
  name: string
  artist: string | { name: string; url?: string; mbid?: string }
  playcount: number
  mbid?: string
  url?: string
  image?: Array<{ '#text': string; size: string }>
}

export interface LastFmTopAlbumsResponse {
  topalbums: {
    album: LastFmAlbum[]
    '@attr': {
      user: string
      totalPages: string
      page: string
      perPage: string
      total: string
    }
  }
}

export interface LastFmUserInfo {
  user: {
    name: string
    realname: string
    url: string
    playcount: string
    registered: {
      unixtime: string
    }
  }
}

export interface LastFmSessionResponse {
  session: {
    name: string
    key: string
    subscriber: number
  }
}

/**
 * Generate MD5 signature for Last.fm API authentication
 */
function generateSignature(params: Record<string, string>, secret: string): string {
  const sortedKeys = Object.keys(params).sort()
  const signatureString = sortedKeys.map((key) => `${key}${params[key]}`).join('')
  return crypto
    .createHash('md5')
    .update(signatureString + secret)
    .digest('hex')
}

/**
 * Fetch Last.fm session key from auth token
 */
export async function getLastFmSession(token: string): Promise<string> {
  const apiKey = process.env.LASTFM_API_KEY!
  const apiSecret = process.env.LASTFM_API_SECRET!

  const params = {
    method: 'auth.getSession',
    api_key: apiKey,
    token,
  }

  const signature = generateSignature(params, apiSecret)

  const url = new URL('https://ws.audioscrobbler.com/2.0/')
  url.searchParams.append('method', params.method)
  url.searchParams.append('api_key', params.api_key)
  url.searchParams.append('token', params.token)
  url.searchParams.append('api_sig', signature)
  url.searchParams.append('format', 'json')

  const response = await fetch(url.toString())
  const data = (await response.json()) as LastFmSessionResponse

  if (!response.ok || !data.session) {
    throw new Error('Failed to get Last.fm session')
  }

  return data.session.key
}

/**
 * Fetch user's top albums from Last.fm
 */
export async function fetchUserTopAlbums(
  sessionKey: string,
  options: { limit?: number; period?: '1month' | '3month' | '6month' | '12month' | 'overall' } = {}
): Promise<LastFmAlbum[]> {
  const apiKey = process.env.LASTFM_API_KEY!

  // First, get the username from the session
  const userInfo = await fetchUserInfo(sessionKey)

  const url = new URL('https://ws.audioscrobbler.com/2.0/')
  url.searchParams.append('method', 'user.getTopAlbums')
  url.searchParams.append('api_key', apiKey)
  url.searchParams.append('user', userInfo.name)
  url.searchParams.append('limit', String(options.limit || 100))
  url.searchParams.append('period', options.period || '1month')
  url.searchParams.append('format', 'json')

  const response = await fetch(url.toString())
  const data = (await response.json()) as LastFmTopAlbumsResponse

  if (!response.ok || !data.topalbums) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch top albums from Last.fm: ${response.status} ${errorText}`)
  }

  return data.topalbums.album || []
}

/**
 * Fetch user info from Last.fm
 */
export async function fetchUserInfo(sessionKey: string): Promise<LastFmUserInfo['user']> {
  const apiKey = process.env.LASTFM_API_KEY!

  const url = new URL('https://ws.audioscrobbler.com/2.0/')
  url.searchParams.append('method', 'user.getInfo')
  url.searchParams.append('api_key', apiKey)
  url.searchParams.append('sk', sessionKey)
  url.searchParams.append('format', 'json')

  const response = await fetch(url.toString())
  const data = (await response.json()) as LastFmUserInfo

  if (!response.ok || !data.user) {
    throw new Error('Failed to fetch user info from Last.fm')
  }

  return data.user
}

/**
 * Generate Last.fm auth URL
 */
export function generateAuthUrl(callbackUrl: string): string {
  const apiKey = process.env.LASTFM_API_KEY!
  return `http://www.last.fm/api/auth/?api_key=${apiKey}&cb=${encodeURIComponent(callbackUrl)}`
}
