import React, { useState, useEffect, useCallback } from 'react'
import { ActionButton } from '@/components'
import { Play, Plug, Ellipsis } from 'lucide-react'

const CLIENT_ID = '47802db6dc5249cbaa5dba475f04cc4d'
const isLocalhost = process.env.NEXT_PUBLIC_IS_LOCALHOST === 'true'
const REDIRECT_URI = isLocalhost ? 'http://localhost:3000/card' : 'https://krater.bsaros.com/card'
const SPOTIFY_AUTHORIZE_ENDPOINT = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1'
// Scopes define the permissions your app requests
const SCOPES = [
  'user-read-playback-state', // Read playback state
  'user-modify-playback-state', // Control playback
  'streaming', // Required for Web Playback SDK (though not used directly here for playback control)
  'user-read-email', // Example: if you need user email
  'user-read-private', // Example: if you need user subscription details
].join(' ') // Space-separated string

// --- PKCE Helper Functions ---

// Generates a secure random string for the code verifier
function generateCodeVerifier(length: number): string {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

// Generates the code challenge from the code verifier
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const data = new TextEncoder().encode(codeVerifier)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  // Base64url encoding
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// --- Utility Function ---

// Extracts Spotify Album ID from various URL formats
function extractAlbumId(url: string): string | null {
  try {
    // Prioritize URL parsing for standard web links
    const urlParts = new URL(url)
    // Example Pathname: /album/1ATL5GLyefXDTJmmQdK0bx
    const pathParts = urlParts.pathname.split('/')
    const albumIndex = pathParts.findIndex((part) => part === 'album')
    if (albumIndex !== -1 && pathParts.length > albumIndex + 1) {
      // Remove potential query params attached to the ID
      return pathParts[albumIndex + 1].split('?')[0]
    }
  } catch (error) {
    // Ignore URL parsing errors (might be a URI or malformed)
    console.warn('URL parsing failed, trying regex/URI match:', error)
  }

  // Fallback for URI format spotify:album:ID
  const uriMatch = url.match(/spotify:album:([a-zA-Z0-9]+)/)
  if (uriMatch && uriMatch[1]) {
    return uriMatch[1]
  }

  // Fallback regex for common web link format if URL parsing failed or it's not a URI
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
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('spotify_access_token')
  )
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // --- Authentication Logic ---

  // 1. Redirect to Spotify for Login
  const handleConnect = async () => {
    setError(null)
    try {
      const codeVerifier = generateCodeVerifier(128)
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      // Store verifier locally to use it after redirect
      localStorage.setItem('spotify_code_verifier', codeVerifier)

      // Construct the authorization URL
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        // Optional: add state parameter for CSRF protection
        // state: generateRandomString(16)
      })

      // Redirect the user
      window.location.href = `${SPOTIFY_AUTHORIZE_ENDPOINT}?${params.toString()}`
    } catch (err) {
      console.error('Error initiating Spotify connection:', err)
      setError('Failed to start Spotify connection.')
    }
  }

  // 2. Handle the callback from Spotify (exchange code for token)
  // This function should be called ONCE when the app loads after redirect
  const handleCallback = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const errorParam = urlParams.get('error')
    const codeVerifier = localStorage.getItem('spotify_code_verifier')

    // Clear params from URL without reloading page
    window.history.replaceState({}, document.title, window.location.pathname)

    if (errorParam) {
      setError(`Spotify login failed: ${errorParam}`)
      localStorage.removeItem('spotify_code_verifier') // Clean up verifier
      return
    }

    if (!code) {
      // Not a callback, or code is missing
      return
    }

    if (!codeVerifier) {
      setError('Code verifier missing. Authentication flow might be broken.')
      return
    }

    setIsLoading(true)
    setError(null)

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
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `Token exchange failed: ${errorData.error_description || response.statusText}`
        )
      }

      const data = await response.json()

      // Store tokens securely (localStorage is convenient but has risks)
      localStorage.setItem('spotify_access_token', data.access_token)
      if (data.refresh_token) {
        // You might want to store the refresh token too, but refreshing
        // typically requires a backend or more complex frontend logic.
        localStorage.setItem('spotify_refresh_token', data.refresh_token)
      }
      // Set token expiry time if needed for proactive refresh
      const expiresIn = data.expires_in // seconds
      const expiryTime = Date.now() + expiresIn * 1000
      localStorage.setItem('spotify_token_expiry', expiryTime.toString())

      setAccessToken(data.access_token)
      localStorage.removeItem('spotify_code_verifier') // Clean up verifier
    } catch (err) {
      console.error('Error exchanging code for token:', err)
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred during token exchange.'
      )
      setAccessToken(null) // Ensure we are logged out on error
      localStorage.removeItem('spotify_access_token')
      localStorage.removeItem('spotify_refresh_token')
      localStorage.removeItem('spotify_token_expiry')
      localStorage.removeItem('spotify_code_verifier')
    } finally {
      setIsLoading(false)
    }
  }, []) // Empty dependency array ensures this runs only once on mount conceptually

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
      // Optional: Get available devices first if you want to target one specifically
      // const devicesResponse = await fetch(`${SPOTIFY_API_BASE_URL}/me/player/devices`, { ... });
      // const devicesData = await devicesResponse.json();
      // const activeDevice = devicesData.devices?.find(d => d.is_active);
      // const deviceId = activeDevice?.id; // Use this in the play request query param if needed

      const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/player/play`, {
        // Add ?device_id=${deviceId} if targeting
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_uri: albumContextUri,
          // You can add offset or position_ms here if needed
          // "offset": { "position": 0 }, // Start from the first track
          // "position_ms": 0
        }),
      })

      if (!response.ok) {
        // Handle specific errors (e.g., 401 Unauthorized, 403 Forbidden, 404 No Active Device)
        let errorMsg = `Spotify API Error: ${response.status} ${response.statusText}`
        try {
          const errorBody = await response.json()
          if (errorBody.error?.message) {
            // Example: "Player command failed: No active device found"
            errorMsg = `Spotify Error: ${errorBody.error.message}`
            if (errorBody.error.reason === 'NO_ACTIVE_DEVICE') {
              errorMsg += ' - Please start playing Spotify on one of your devices.'
            } else if (response.status === 401) {
              errorMsg += ' - Token might be invalid or expired. Please reconnect.'
              // Clear potentially invalid token
              setAccessToken(null)
              localStorage.removeItem('spotify_access_token')
              localStorage.removeItem('spotify_refresh_token')
              localStorage.removeItem('spotify_token_expiry')
            }
          }
        } catch (_jsonError) {
          /* Ignore if response body isn't valid JSON */
        }
        throw new Error(errorMsg)
      }

      // Playback started successfully (status 202 Accepted or 204 No Content)
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

  // --- Effect Hook ---
  // Check for callback code ONCE on component mount/app load
  useEffect(() => {
    // Check if we are in the redirect URI with a code
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('code')) {
      handleCallback()
    }
    // Check if token is expired (basic check)
    const expiryTime = localStorage.getItem('spotify_token_expiry')
    if (accessToken && expiryTime && Date.now() > parseInt(expiryTime, 10)) {
      console.log('Spotify token expired.')
      setAccessToken(null) // Treat as logged out
      localStorage.removeItem('spotify_access_token')
      localStorage.removeItem('spotify_refresh_token')
      localStorage.removeItem('spotify_token_expiry')
      setError('Spotify session expired. Please reconnect.')
    }
  }, [handleCallback, accessToken]) // Include accessToken to re-check expiry if it changes

  return (
    <div>
      {error && <p>Error: {error}</p>}
      {isLoading ? (
        <ActionButton onClick={handleConnect} icon={Ellipsis} size={48} />
      ) : !accessToken ? (
        <ActionButton onClick={handleConnect} icon={Plug} size={48} />
      ) : (
        <ActionButton onClick={handlePlay} icon={Play} size={48} />
      )}
    </div>
  )
}
