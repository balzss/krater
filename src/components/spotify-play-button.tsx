import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ActionButton } from '@/components' // Assuming ActionButton is correctly imported
import { Play, Plug, Ellipsis } from 'lucide-react'

// --- Configuration Constants ---
const CLIENT_ID = '47802db6dc5249cbaa5dba475f04cc4d' // Your Spotify application's Client ID
const isLocalhost = process.env.NEXT_PUBLIC_IS_LOCALHOST === 'true' // Check if running locally
// The URL Spotify redirects back to after authorization. Must be registered in Spotify Dashboard.
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

// --- Popup Communication Constants ---
// Key for localStorage item used to signal if the popup callback completed (success or error)
// NOTE: This signal might still be affected by cross-origin localStorage if used heavily,
// but the core verifier transfer now uses the state parameter.
const POPUP_CALLBACK_SIGNAL_KEY = 'spotify_popup_callback_completed'
// Identifier for postMessage events carrying Spotify token data between popup and main window
const POST_MESSAGE_TYPE_SPOTIFY_TOKEN = 'spotifyToken'

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
  // Ref: Hold a reference to the opened authentication popup window
  const popupRef = useRef<Window | null>(null)

  // --- Authentication Logic ---

  // Function to initiate the Spotify connection process by opening a popup.
  const handleConnect = async () => {
    setError(null) // Clear previous errors
    setIsLoading(true) // Set loading state

    try {
      // 1. Generate PKCE codes
      const codeVerifier = generateCodeVerifier(128)
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      // 2. Pass verifier via 'state' parameter.
      // console.log("Main Window: Generated verifier:", codeVerifier); // Debug log

      // Clear any leftover signal from previous attempts
      localStorage.removeItem(POPUP_CALLBACK_SIGNAL_KEY)

      // 3. Construct the Spotify authorization URL with necessary parameters.
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code', // Use Authorization Code flow
        redirect_uri: REDIRECT_URI, // Where Spotify redirects after login
        scope: SCOPES, // Permissions requested
        code_challenge_method: 'S256', // PKCE method
        code_challenge: codeChallenge, // The generated challenge
        state: codeVerifier, // Pass the verifier in the state parameter
      })
      const authUrl = `${SPOTIFY_AUTHORIZE_ENDPOINT}?${params.toString()}`

      // 4. Define popup window dimensions and position.
      const popupWidth = 500
      const popupHeight = 650
      const left = window.screenX + (window.outerWidth - popupWidth) / 2
      const top = window.screenY + (window.outerHeight - popupHeight) / 2

      // 5. Open the Spotify authorization page in a new popup window.
      popupRef.current = window.open(
        authUrl,
        'SpotifyAuthPopup', // Window name
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes` // Window features
      )

      // Check if the popup was successfully opened (might be blocked by browser)
      if (!popupRef.current) {
        throw new Error('Failed to open popup window. Check popup blocker.')
      }

      // 6. Set an interval timer to check if the user manually closed the popup.
      const checkPopupClosed = setInterval(() => {
        // Check FIRST if the callback signal exists (meaning popup finished successfully or with error)
        const signal = localStorage.getItem(POPUP_CALLBACK_SIGNAL_KEY)
        if (signal) {
          clearInterval(checkPopupClosed) // Stop checking
          localStorage.removeItem(POPUP_CALLBACK_SIGNAL_KEY) // Clean up signal
          // isLoading will be set to false by the message handler
        }
        // Check SECOND if the popup reference exists, is closed, and there was NO signal yet
        else if (popupRef.current && popupRef.current.closed) {
          clearInterval(checkPopupClosed) // Stop checking
          // Only set error if no signal was found above
          setError('Login cancelled or popup closed prematurely.')
          setIsLoading(false) // Update loading state
        }
      }, 1000) // Check every second
    } catch (err) {
      // Handle errors during the connection initiation process
      console.error('Error initiating Spotify connection:', err)
      setError(err instanceof Error ? err.message : 'Failed to start Spotify connection.')
      setIsLoading(false)
    }
  }

  // Function intended to run *inside the popup window* after Spotify redirects back.
  // It exchanges the authorization code for an access token and sends it back to the main window.
  const handlePopupCallback = useCallback(async () => {
    console.log('handlePopupCallback: Function executing in popup.') // Debug log
    // Extract code/error from the popup's URL query parameters
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const errorParam = urlParams.get('error')

    // Retrieve the verifier from the 'state' parameter returned by Spotify in the URL.
    const state = urlParams.get('state')
    console.log(
      'handlePopupCallback: Attempting to get verifier from state parameter. Value:',
      state
    )
    const codeVerifier = state // Use the state value as the verifier

    // Ensure this code is running in a window opened by our main app
    if (!window.opener) {
      console.warn(
        'handlePopupCallback called but window.opener is null. Not in expected popup context.'
      )
      localStorage.setItem(POPUP_CALLBACK_SIGNAL_KEY, 'error')
      // Don't close here if opener is missing, might prevent debugging
      // window.close();
      return // Exit if not in a popup context
    }

    // Clean the URL in the popup (remove code/error/state params)
    // This might interfere with seeing the params if debugging quickly, consider commenting out if needed
    window.history.replaceState({}, document.title, window.location.pathname)

    // Handle case where Spotify returned an error
    if (errorParam) {
      console.error('handlePopupCallback: Spotify returned error:', errorParam) // Debug log
      window.opener.postMessage(
        { type: POST_MESSAGE_TYPE_SPOTIFY_TOKEN, error: `Spotify login failed: ${errorParam}` },
        window.location.origin
      )
      localStorage.setItem(POPUP_CALLBACK_SIGNAL_KEY, 'error') // Signal completion (error)
      // window.close(); // Don't close automatically for debugging
      return
    }

    // Handle case where the authorization code is missing
    if (!code) {
      console.error('handlePopupCallback: Authorization code missing from URL.') // Debug log
      window.opener.postMessage(
        { type: POST_MESSAGE_TYPE_SPOTIFY_TOKEN, error: 'Authorization code missing.' },
        window.location.origin
      )
      localStorage.setItem(POPUP_CALLBACK_SIGNAL_KEY, 'error')
      // window.close(); // Don't close automatically for debugging
      return
    }

    // Handle case where the code verifier (from state) is missing
    if (!codeVerifier) {
      console.error('handlePopupCallback: Code verifier missing from state parameter.') // Debug log
      window.opener.postMessage(
        { type: POST_MESSAGE_TYPE_SPOTIFY_TOKEN, error: 'Code verifier (state) missing.' },
        window.location.origin
      )
      localStorage.setItem(POPUP_CALLBACK_SIGNAL_KEY, 'error')
      // window.close(); // Don't close automatically for debugging
      return
    }

    console.log(
      'handlePopupCallback: Code and verifier (from state) found. Proceeding with token exchange.'
    ) // Debug log

    // --- Token Exchange ---
    try {
      // Prepare the request body for the token endpoint
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code, // The authorization code received from Spotify
        redirect_uri: REDIRECT_URI, // Must match the URI used in the initial auth request
        client_id: CLIENT_ID,
        code_verifier: codeVerifier, // The verifier received via the state parameter
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
          'handlePopupCallback: Token exchange failed. Status:',
          response.status,
          'Response:',
          errorText
        ) // Debug log
        let errorDesc = response.statusText
        try {
          // Try to parse JSON for more details
          const errorData = JSON.parse(errorText)
          errorDesc = errorData.error_description || errorDesc
        } catch (e) {
          /* Ignore if not JSON */
          console.warn(e)
        }
        throw new Error(`Token exchange failed: ${errorDesc}`)
      }

      // Parse the successful response (contains access_token, refresh_token, expires_in)
      const data = await response.json()
      console.log('handlePopupCallback: Token exchange successful.') // Debug log

      // Send the token data back to the main (opener) window via postMessage
      window.opener.postMessage(
        {
          type: POST_MESSAGE_TYPE_SPOTIFY_TOKEN, // Identify the message type
          payload: {
            // The data being sent
            accessToken: data.access_token,
            refreshToken: data.refresh_token, // Include refresh token if available
            expiresIn: data.expires_in, // Include expiry time
          },
        },
        window.location.origin
      ) // Specify the target origin for security

      localStorage.setItem(POPUP_CALLBACK_SIGNAL_KEY, 'success') // Signal completion (success)
    } catch (err) {
      // Handle errors during the token exchange
      console.error('Error exchanging code for token in popup:', err)
      const errorMsg = err instanceof Error ? err.message : 'Token exchange failed.'
      // Send error message back to the main window
      window.opener.postMessage(
        { type: POST_MESSAGE_TYPE_SPOTIFY_TOKEN, error: errorMsg },
        window.location.origin
      )
      localStorage.setItem(POPUP_CALLBACK_SIGNAL_KEY, 'error') // Signal completion (error)
    } finally {
      console.log('handlePopupCallback: Reached finally block. NOT closing popup for debugging.') // Debug log
      // Temporarily disable closing the popup to allow inspection
      // window.close(); // <--- KEPT COMMENTED OUT FOR DEBUGGING
    }
  }, []) // useCallback with empty dependency array as it doesn't depend on component state/props

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

  // Effect Hook 1: Runs ONLY if this component instance is loaded in the popup callback window.
  useEffect(() => {
    console.log('Popup Effect Hook 1: Checking URL and opener...') // Debug log
    const urlParams = new URLSearchParams(window.location.search)
    // Check if URL has 'code' or 'error' params AND if it's a popup opened by our app
    if (
      (urlParams.has('code') || urlParams.has('error')) &&
      window.opener &&
      !window.opener.closed
    ) {
      console.log('Popup Effect Hook 1: Conditions met, calling handlePopupCallback.') // Debug log
      // If yes, execute the token exchange and postMessage logic
      handlePopupCallback()
    } else {
      // This log might appear if the component renders on the main page before redirect or after callback
      // console.log("Popup Effect Hook 1: Conditions not met (Not callback or not in popup)."); // Debug log
    }
  }, [handlePopupCallback]) // Dependency ensures it runs if handlePopupCallback changes (it won't here)

  // Effect Hook 2: Runs in the MAIN component instance (in the iframe) to listen for messages from the popup.
  useEffect(() => {
    // Define the message handler function
    const handleMessage = (event: MessageEvent) => {
      // Security: Ensure the message comes from the expected origin (where your app is hosted)
      if (event.origin !== window.location.origin) {
        // console.warn(`Message received from unexpected origin: ${event.origin}. Ignoring.`);
        return
      }

      // Destructure data from the message event
      const { type, payload, error: messageError } = event.data

      // Check if it's the Spotify token message we're expecting
      if (type === POST_MESSAGE_TYPE_SPOTIFY_TOKEN) {
        console.log('Main Window: Received message from popup:', event.data) // Debug log
        setIsLoading(false) // Stop loading indicator in the main window

        // Handle errors sent from the popup
        if (messageError) {
          setError(`Spotify error: ${messageError}`)
          setAccessToken(null) // Reset token state
          // Clear any potentially stored tokens
          localStorage.removeItem('spotify_access_token')
          localStorage.removeItem('spotify_refresh_token')
          localStorage.removeItem('spotify_token_expiry')
        }
        // Handle successful token payload from the popup
        else if (payload?.accessToken) {
          const token = payload.accessToken
          const refreshToken = payload.refreshToken
          const expiresIn = payload.expiresIn

          setAccessToken(token) // Update state with the new token
          setError(null) // Clear any previous errors

          // Store the received token details in localStorage
          localStorage.setItem('spotify_access_token', token)
          if (refreshToken) {
            localStorage.setItem('spotify_refresh_token', refreshToken)
          }
          if (expiresIn) {
            // Calculate and store the token's expiry timestamp
            const expiryTime = Date.now() + expiresIn * 1000
            localStorage.setItem('spotify_token_expiry', expiryTime.toString())
          }
          // Clean up popup reference if it's closed
          if (popupRef.current && popupRef.current.closed) {
            popupRef.current = null
          }
        } else {
          // Handle unexpected message format
          setError('Received invalid message from popup.')
        }
        // Clean up localStorage signals regardless of success/error
        localStorage.removeItem(POPUP_CALLBACK_SIGNAL_KEY)
        // No longer need to remove verifier from localStorage here
        // localStorage.removeItem('spotify_code_verifier'); // REMOVED
      }
    }

    // Add the event listener when the component mounts
    window.addEventListener('message', handleMessage)

    // Cleanup function: Remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('message', handleMessage)
      // Also clean up signal in case component unmounts while popup is open
      localStorage.removeItem(POPUP_CALLBACK_SIGNAL_KEY)
    }
  }, []) // Empty dependency array means this effect runs only once on mount

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
