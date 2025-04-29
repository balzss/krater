import React, { useState, useEffect, useCallback } from 'react'
import { ActionButton } from '@/components' // Assuming ActionButton is correctly imported
import { Play, Plug, Ellipsis } from 'lucide-react'

// --- Configuration Constants ---
const CLIENT_ID = '47802db6dc5249cbaa5dba475f04cc4d' // Your Spotify application's Client ID
const isLocalhost = process.env.NEXT_PUBLIC_IS_LOCALHOST === 'true' // Check if running locally
// The URL Spotify redirects the WebView back to after authorization.
const REDIRECT_URI = isLocalhost ? 'http://localhost:3000/card' : 'https://krater.bsaros.com/card'
const SPOTIFY_AUTHORIZE_ENDPOINT = 'https://accounts.spotify.com/authorize' // Spotify's authorization page URL
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token' // Spotify's token exchange URL
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1' // Base URL for Spotify Web API calls
// Permissions requested from the user (space-separated string)
const SCOPES = [
  'user-read-playback-state', // Read playback state
  'user-modify-playback-state', // Control playback
  'streaming', // Required for Web Playback SDK features (if used)
  'user-read-email', // Example: Read user's email
  'user-read-private', // Example: Read user's subscription details
].join(' ')

// --- PKCE Helper Functions ---

// Generates a secure random string used for the PKCE code verifier.
function generateCodeVerifier(length: number): string {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

// Creates a SHA-256 hash of the code verifier, then base64url encodes it for the PKCE code challenge.
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const data = new TextEncoder().encode(codeVerifier)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// --- Utility Function ---

// Extracts the Spotify Album ID from various URL formats (web link or URI).
function extractAlbumId(url: string): string | null {
  try {
    // Try parsing as a standard URL first
    const urlParts = new URL(url)
    const pathParts = urlParts.pathname.split('/')
    const albumIndex = pathParts.findIndex((part) => part === 'album')
    if (albumIndex !== -1 && pathParts.length > albumIndex + 1) {
      return pathParts[albumIndex + 1].split('?')[0] // Get ID part, remove query params
    }
  } catch (error) {
    // Ignore errors if it's not a standard URL (e.g., it might be a URI)
    console.warn('URL parsing failed, trying regex/URI match:', error)
  }
  // Fallback: Try matching Spotify URI format (spotify:album:...)
  const uriMatch = url.match(/spotify:album:([a-zA-Z0-9]+)/)
  if (uriMatch && uriMatch[1]) {
    return uriMatch[1]
  }
  // Fallback: Try matching common web link format (spotify.com/album/...)
  const webLinkMatch = url.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/)
  if (webLinkMatch && webLinkMatch[1]) {
    return webLinkMatch[1]
  }
  // If no match found, log an error and return null
  console.error('Could not extract Album ID from URL:', url)
  return null
}

// --- React Component ---
interface SpotifyPlayButtonProps {
  albumUrl: string // Prop to receive the Spotify album URL
}

export const SpotifyPlayButton: React.FC<SpotifyPlayButtonProps> = ({ albumUrl }) => {
  // State: Store the access token (retrieved from localStorage initially)
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem('spotify_access_token')
  )
  // State: Store any error messages to display to the user
  const [error, setError] = useState<string | null>(null)
  // State: Indicate loading status (e.g., during auth or API calls)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // --- Authentication Logic ---

  // Function to initiate the Spotify connection process by redirecting the WebView.
  const handleConnect = async () => {
    setError(null) // Clear previous errors
    // Don't set isLoading here, the page will navigate away
    // setIsLoading(true);

    try {
      // 1. Generate PKCE codes
      const codeVerifier = generateCodeVerifier(128)
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      // 2. Store the verifier in localStorage. The page loaded at REDIRECT_URI
      //    will need to retrieve this. This assumes the WebView maintains
      //    localStorage across the redirect to Spotify and back.
      console.log('Storing verifier in localStorage:', codeVerifier)
      localStorage.setItem('spotify_code_verifier', codeVerifier)

      // 3. Construct the Spotify authorization URL with necessary parameters.
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code', // Use Authorization Code flow
        redirect_uri: REDIRECT_URI, // Where Spotify redirects the WebView back to
        scope: SCOPES, // Permissions requested
        code_challenge_method: 'S256', // PKCE method
        code_challenge: codeChallenge, // The generated challenge
        // No state parameter needed if using localStorage for verifier
      })
      const authUrl = `${SPOTIFY_AUTHORIZE_ENDPOINT}?${params.toString()}`

      // 4. Redirect the current WebView window to the Spotify authorization URL.
      console.log('Redirecting WebView to Spotify:', authUrl)
      window.location.href = authUrl
      // The code execution stops here as the window navigates away.
    } catch (err) {
      // Handle errors during the connection initiation process (e.g., challenge generation)
      console.error('Error initiating Spotify connection:', err)
      setError(err instanceof Error ? err.message : 'Failed to start Spotify connection.')
      setIsLoading(false) // Set loading false only if redirect fails immediately
    }
  }

  // Function to handle the callback when the WebView is redirected back from Spotify to REDIRECT_URI.
  // This should run when the component mounts on the page specified by REDIRECT_URI.
  const handleCallback = useCallback(async () => {
    console.log('handleCallback: Checking for authorization code and verifier...')
    // Extract code and error from the current URL's query parameters
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const errorParam = urlParams.get('error')

    // Retrieve the verifier stored before the redirect
    const codeVerifier = localStorage.getItem('spotify_code_verifier')
    console.log('handleCallback: Retrieved verifier from localStorage:', codeVerifier)

    // Clean the URL (remove code/error params) without reloading the page.
    // Important to do this early.
    window.history.replaceState({}, document.title, window.location.pathname)

    // Handle case where Spotify returned an error
    if (errorParam) {
      console.error('handleCallback: Spotify returned error:', errorParam)
      setError(`Spotify login failed: ${errorParam}`)
      localStorage.removeItem('spotify_code_verifier') // Clean up verifier
      return // Stop processing
    }

    // Handle case where the authorization code is missing (shouldn't happen if no error)
    if (!code) {
      console.log('handleCallback: No authorization code found in URL. Not a callback.')
      // This is normal if the page loads without being redirected from Spotify.
      return // Exit silently
    }

    // Handle case where the code verifier is missing from localStorage
    // This indicates a problem with localStorage persistence or the flow.
    if (!codeVerifier) {
      console.error('handleCallback: Code verifier missing from localStorage. Auth flow broken.')
      setError('Code verifier missing. Cannot complete authentication.')
      // Don't remove verifier as it's already missing
      return // Stop processing
    }

    console.log('handleCallback: Code and verifier found. Proceeding with token exchange.')
    setIsLoading(true) // Show loading indicator during token exchange
    setError(null)

    // --- Token Exchange ---
    try {
      // Prepare the request body for the token endpoint
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code, // The authorization code received from Spotify
        redirect_uri: REDIRECT_URI, // Must match the URI used in the initial auth request
        client_id: CLIENT_ID,
        code_verifier: codeVerifier, // The verifier retrieved from localStorage
      })

      // Make the POST request to exchange the code for tokens
      const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })

      // Check if the token exchange was successful
      if (!response.ok) {
        const errorText = await response.text() // Get raw error text
        console.error(
          'handleCallback: Token exchange failed. Status:',
          response.status,
          'Response:',
          errorText
        )
        let errorDesc = response.statusText
        try {
          // Try to parse JSON for more details
          const errorData = JSON.parse(errorText)
          errorDesc = errorData.error_description || errorDesc
        } catch (_e) {
          /* Ignore if not JSON */
        }
        throw new Error(`Token exchange failed: ${errorDesc}`)
      }

      // Parse the successful response (contains access_token, refresh_token, expires_in)
      const data = await response.json()
      console.log('handleCallback: Token exchange successful.')

      // Store the received token details in localStorage
      localStorage.setItem('spotify_access_token', data.access_token)
      if (data.refresh_token) {
        localStorage.setItem('spotify_refresh_token', data.refresh_token)
      }
      if (data.expires_in) {
        const expiryTime = Date.now() + data.expires_in * 1000
        localStorage.setItem('spotify_token_expiry', expiryTime.toString())
      }

      // Update the component's state with the new token
      setAccessToken(data.access_token)
      setError(null) // Clear any previous errors

      // Clean up the stored verifier
      localStorage.removeItem('spotify_code_verifier')
    } catch (err) {
      // Handle errors during the token exchange
      console.error('Error exchanging code for token:', err)
      setError(err instanceof Error ? err.message : 'Token exchange failed.')
      setAccessToken(null) // Ensure logged out state on error
      // Clear potentially invalid tokens and the verifier
      localStorage.removeItem('spotify_access_token')
      localStorage.removeItem('spotify_refresh_token')
      localStorage.removeItem('spotify_token_expiry')
      localStorage.removeItem('spotify_code_verifier')
    } finally {
      // Ensure loading state is turned off
      setIsLoading(false)
    }
  }, []) // useCallback with empty dependency array

  // --- Playback Logic ---
  // Function to initiate playback of the specified album using the Spotify Web API.
  const handlePlay = async () => {
    // Ensure we have an access token
    if (!accessToken) {
      setError('Not connected to Spotify.')
      return
    }
    // Ensure an album URL is provided
    if (!albumUrl) {
      setError('No album URL provided.')
      return
    }

    // Extract the Album ID from the URL
    const albumId = extractAlbumId(albumUrl)
    if (!albumId) {
      setError('Could not extract a valid Album ID from the provided URL.')
      return
    }

    // Construct the Spotify context URI for the album
    const albumContextUri = `spotify:album:${albumId}`
    setIsLoading(true) // Indicate loading state
    setError(null) // Clear previous errors

    try {
      // Make the PUT request to Spotify's 'play' endpoint
      const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/player/play`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`, // Include the access token
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_uri: albumContextUri, // Tell Spotify what to play (the album)
        }),
      })

      // Check if the API call was successful
      if (!response.ok) {
        let errorMsg = `Spotify API Error: ${response.status} ${response.statusText}`
        try {
          // Try to parse more specific error details from Spotify's response
          const errorBody = await response.json()
          if (errorBody.error?.message) {
            errorMsg = `Spotify Error: ${errorBody.error.message}`
            // Provide helpful messages for common errors
            if (errorBody.error.reason === 'NO_ACTIVE_DEVICE') {
              errorMsg += ' - Please start playing Spotify on one of your devices.'
            } else if (response.status === 401) {
              // Unauthorized (token expired/invalid)
              errorMsg += ' - Token might be invalid or expired. Please reconnect.'
              // Clear the potentially invalid token from state and localStorage
              setAccessToken(null)
              localStorage.removeItem('spotify_access_token')
              localStorage.removeItem('spotify_refresh_token')
              localStorage.removeItem('spotify_token_expiry')
            }
          }
        } catch (_jsonError) {
          /* Ignore if response body isn't valid JSON */
        }
        // Throw an error to be caught by the catch block
        throw new Error(errorMsg)
      }
      // Log success if the command was accepted by Spotify
      console.log('Playback command sent successfully.')
    } catch (err) {
      // Handle errors during the playback API call
      console.error('Error starting playback:', err)
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred while trying to play.'
      )
    } finally {
      // Ensure loading state is turned off
      setIsLoading(false)
    }
  }

  // --- Effect Hooks ---

  // Effect Hook 1: Runs ONCE on component mount to check if the current URL contains
  // the authorization code (meaning we just got redirected back from Spotify).
  useEffect(() => {
    console.log('Effect Hook 1: Component mounted. Checking for callback code...')
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('code') || urlParams.has('error')) {
      console.log('Effect Hook 1: Code or error found in URL, calling handleCallback.')
      // If code/error exists, execute the token exchange logic.
      handleCallback()
    } else {
      console.log('Effect Hook 1: No code/error found in URL.')
    }
  }, [handleCallback]) // Dependency array includes handleCallback

  // Effect Hook 3: Runs in the MAIN component instance to check if the stored token has expired.
  useEffect(() => {
    const expiryTime = localStorage.getItem('spotify_token_expiry')
    // Check if token exists, expiry time exists, and current time is past expiry time
    if (accessToken && expiryTime && Date.now() > parseInt(expiryTime, 10)) {
      console.log('Spotify token expired.')
      // If expired, clear the token from state and localStorage
      setAccessToken(null)
      localStorage.removeItem('spotify_access_token')
      localStorage.removeItem('spotify_refresh_token')
      localStorage.removeItem('spotify_token_expiry')
      setError('Spotify session expired. Please reconnect.') // Inform user
    }
  }, [accessToken]) // Re-run this check whenever the accessToken state changes

  // --- Render Logic ---
  // Renders the appropriate button based on the current state (loading, connected, not connected).
  return (
    <div>
      {/* Display error messages */}
      {error && <p style={{ color: 'red', fontSize: '0.8em' }}>Error: {error}</p>}

      {/* Show loading indicator (Ellipsis icon) */}
      {isLoading ? (
        <ActionButton onClick={() => {}} icon={Ellipsis} size={48} disabled={true} />
      ) : // Show connect button (Plug icon) if not loading and no access token
      !accessToken ? (
        <ActionButton onClick={handleConnect} icon={Plug} size={48} />
      ) : (
        // Show play button (Play icon) if not loading and access token exists
        <ActionButton onClick={handlePlay} icon={Play} size={48} disabled={!albumUrl} /> // Disable play if no albumUrl
      )}
    </div>
  )
}
