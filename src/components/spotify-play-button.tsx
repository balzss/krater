import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ActionButton } from '@/components'
import { Play, Plug, Ellipsis } from 'lucide-react'

const CLIENT_ID = '47802db6dc5249cbaa5dba475f04cc4d'
const isLocalhost = process.env.NEXT_PUBLIC_IS_LOCALHOST === 'true'
const REDIRECT_URI = isLocalhost ? 'http://localhost:3000/card' : 'https://krater.bsaros.com/card'
const SPOTIFY_AUTHORIZE_ENDPOINT = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1'
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'streaming',
  'user-read-email',
  'user-read-private',
].join(' ')

const POPUP_CALLBACK_SIGNAL_KEY = 'spotify_popup_callback_completed'
const POST_MESSAGE_TYPE_SPOTIFY_TOKEN = 'spotifyToken'

// --- PKCE Helper Functions ---
function generateCodeVerifier(length: number): string {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const data = new TextEncoder().encode(codeVerifier)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// --- Utility Function ---
function extractAlbumId(url: string): string | null {
  try {
    const urlParts = new URL(url)
    const pathParts = urlParts.pathname.split('/')
    const albumIndex = pathParts.findIndex((part) => part === 'album')
    if (albumIndex !== -1 && pathParts.length > albumIndex + 1) {
      return pathParts[albumIndex + 1].split('?')[0]
    }
  } catch (error) {
    console.warn('URL parsing failed, trying regex/URI match:', error)
  }
  const uriMatch = url.match(/spotify:album:([a-zA-Z0-9]+)/)
  if (uriMatch && uriMatch[1]) {
    return uriMatch[1]
  }
  const webLinkMatch = url.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/)
  if (webLinkMatch && webLinkMatch[1]) {
    return webLinkMatch[1]
  }
  console.error('Could not extract Album ID from URL:', url)
  return null
}

// --- React Component ---
interface SpotifyPlayButtonProps {
  albumUrl: string
}

export const SpotifyPlayButton: React.FC<SpotifyPlayButtonProps> = ({ albumUrl }) => {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem('spotify_access_token')
  )
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const popupRef = useRef<Window | null>(null)

  // --- Authentication Logic ---

  const handleConnect = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const codeVerifier = generateCodeVerifier(128)
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      localStorage.setItem('spotify_code_verifier', codeVerifier)
      localStorage.removeItem(POPUP_CALLBACK_SIGNAL_KEY)

      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
      })

      const authUrl = `${SPOTIFY_AUTHORIZE_ENDPOINT}?${params.toString()}`
      const popupWidth = 500
      const popupHeight = 650
      const left = window.screenX + (window.outerWidth - popupWidth) / 2
      const top = window.screenY + (window.outerHeight - popupHeight) / 2

      popupRef.current = window.open(
        authUrl,
        'SpotifyAuthPopup',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
      )

      if (!popupRef.current) {
        throw new Error('Failed to open popup window. Check popup blocker.')
      }

      const checkPopupClosed = setInterval(() => {
        if (
          popupRef.current &&
          popupRef.current.closed &&
          !localStorage.getItem(POPUP_CALLBACK_SIGNAL_KEY)
        ) {
          clearInterval(checkPopupClosed)
          setError('Login cancelled or popup closed prematurely.')
          setIsLoading(false)
          localStorage.removeItem('spotify_code_verifier')
        } else if (localStorage.getItem(POPUP_CALLBACK_SIGNAL_KEY)) {
          clearInterval(checkPopupClosed)
          localStorage.removeItem(POPUP_CALLBACK_SIGNAL_KEY)
          // Don't set isLoading false here, wait for message
        }
      }, 5000)
    } catch (err) {
      console.error('Error initiating Spotify connection:', err)
      setError(err instanceof Error ? err.message : 'Failed to start Spotify connection.')
      setIsLoading(false)
      localStorage.removeItem('spotify_code_verifier')
    }
  }

  const handlePopupCallback = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const errorParam = urlParams.get('error')
    const codeVerifier = localStorage.getItem('spotify_code_verifier')

    if (!window.opener) {
      return
    }

    window.history.replaceState({}, document.title, window.location.pathname)

    if (errorParam) {
      window.opener.postMessage(
        { type: POST_MESSAGE_TYPE_SPOTIFY_TOKEN, error: `Spotify login failed: ${errorParam}` },
        window.location.origin
      )
      localStorage.removeItem('spotify_code_verifier')
      localStorage.setItem(POPUP_CALLBACK_SIGNAL_KEY, 'error')
      window.close()
      return
    }

    if (!code) {
      window.opener.postMessage(
        { type: POST_MESSAGE_TYPE_SPOTIFY_TOKEN, error: 'Authorization code missing.' },
        window.location.origin
      )
      localStorage.removeItem('spotify_code_verifier')
      localStorage.setItem(POPUP_CALLBACK_SIGNAL_KEY, 'error')
      window.close()
      return
    }

    if (!codeVerifier) {
      window.opener.postMessage(
        { type: POST_MESSAGE_TYPE_SPOTIFY_TOKEN, error: 'Code verifier missing.' },
        window.location.origin
      )
      localStorage.setItem(POPUP_CALLBACK_SIGNAL_KEY, 'error')
      window.close()
      return
    }

    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier,
      })

      const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `Token exchange failed: ${errorData.error_description || response.statusText}`
        )
      }

      const data = await response.json()

      window.opener.postMessage(
        {
          type: POST_MESSAGE_TYPE_SPOTIFY_TOKEN,
          payload: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
          },
        },
        window.location.origin
      )

      localStorage.removeItem('spotify_code_verifier')
      localStorage.setItem(POPUP_CALLBACK_SIGNAL_KEY, 'success')
    } catch (err) {
      console.error('Error exchanging code for token in popup:', err)
      const errorMsg = err instanceof Error ? err.message : 'Token exchange failed.'
      window.opener.postMessage(
        { type: POST_MESSAGE_TYPE_SPOTIFY_TOKEN, error: errorMsg },
        window.location.origin
      )
      localStorage.removeItem('spotify_code_verifier')
      localStorage.setItem(POPUP_CALLBACK_SIGNAL_KEY, 'error')
    } finally {
      window.close()
    }
  }, [])

  // --- Playback Logic ---
  const handlePlay = async () => {
    if (!accessToken) {
      setError('Not connected to Spotify.')
      return
    }
    if (!albumUrl) {
      setError('No album URL provided.')
      return
    }

    const albumId = extractAlbumId(albumUrl)
    if (!albumId) {
      setError('Could not extract a valid Album ID from the provided URL.')
      return
    }

    const albumContextUri = `spotify:album:${albumId}`
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/player/play`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_uri: albumContextUri,
        }),
      })

      if (!response.ok) {
        let errorMsg = `Spotify API Error: ${response.status} ${response.statusText}`
        try {
          const errorBody = await response.json()
          if (errorBody.error?.message) {
            errorMsg = `Spotify Error: ${errorBody.error.message}`
            if (errorBody.error.reason === 'NO_ACTIVE_DEVICE') {
              errorMsg += ' - Please start playing Spotify on one of your devices.'
            } else if (response.status === 401) {
              errorMsg += ' - Token might be invalid or expired. Please reconnect.'
              setAccessToken(null)
              localStorage.removeItem('spotify_access_token')
              localStorage.removeItem('spotify_refresh_token')
              localStorage.removeItem('spotify_token_expiry')
            }
          }
        } catch (_jsonError) {
          /* Ignore */
        }
        throw new Error(errorMsg)
      }
      console.log('Playback command sent successfully.')
    } catch (err) {
      console.error('Error starting playback:', err)
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred while trying to play.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // --- Effect Hooks ---

  // Effect for popup callback logic
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (
      (urlParams.has('code') || urlParams.has('error')) &&
      window.opener &&
      !window.opener.closed
    ) {
      handlePopupCallback()
    }
  }, [handlePopupCallback])

  // Effect for listening to messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        // console.warn(`Message received from unexpected origin: ${event.origin}. Ignoring.`);
        return
      }

      const { type, payload, error: messageError } = event.data

      if (type === POST_MESSAGE_TYPE_SPOTIFY_TOKEN) {
        setIsLoading(false) // Stop loading indicator in parent
        if (messageError) {
          setError(`Spotify error: ${messageError}`)
          setAccessToken(null)
          localStorage.removeItem('spotify_access_token')
          localStorage.removeItem('spotify_refresh_token')
          localStorage.removeItem('spotify_token_expiry')
        } else if (payload?.accessToken) {
          const token = payload.accessToken
          const refreshToken = payload.refreshToken
          const expiresIn = payload.expiresIn

          setAccessToken(token)
          setError(null)

          localStorage.setItem('spotify_access_token', token)
          if (refreshToken) {
            localStorage.setItem('spotify_refresh_token', refreshToken)
          }
          if (expiresIn) {
            const expiryTime = Date.now() + expiresIn * 1000
            localStorage.setItem('spotify_token_expiry', expiryTime.toString())
          }
          if (popupRef.current && popupRef.current.closed) {
            popupRef.current = null
          }
        } else {
          setError('Received invalid message from popup.')
        }
        localStorage.removeItem(POPUP_CALLBACK_SIGNAL_KEY)
        localStorage.removeItem('spotify_code_verifier')
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
      localStorage.removeItem(POPUP_CALLBACK_SIGNAL_KEY)
    }
  }, [])

  // Effect to check for expired token
  useEffect(() => {
    const expiryTime = localStorage.getItem('spotify_token_expiry')
    if (accessToken && expiryTime && Date.now() > parseInt(expiryTime, 10)) {
      console.log('Spotify token expired.')
      setAccessToken(null)
      localStorage.removeItem('spotify_access_token')
      localStorage.removeItem('spotify_refresh_token')
      localStorage.removeItem('spotify_token_expiry')
      setError('Spotify session expired. Please reconnect.')
    }
  }, [accessToken])

  return (
    <div>
      {error && <p style={{ color: 'red', fontSize: '0.8em' }}>Error: {error}</p>}
      {isLoading ? (
        <ActionButton onClick={() => {}} icon={Ellipsis} size={48} disabled={true} />
      ) : !accessToken ? (
        <ActionButton onClick={handleConnect} icon={Plug} size={48} />
      ) : (
        <ActionButton onClick={handlePlay} icon={Play} size={48} disabled={!albumUrl} />
      )}
    </div>
  )
}
