// Quick test script to debug Last.fm API

async function test() {
  console.log('Testing Last.fm API...')

  // Get session key from cookie (you'll need to manually set this)
  const sessionKey = 'YOUR_SESSION_KEY_HERE' // Replace with actual session key from browser devtools

  if (!sessionKey) {
    console.error('No session key provided')
    return
  }

  const apiKey = process.env.LASTFM_API_KEY
  console.log('API Key:', apiKey ? 'Present' : 'Missing')

  // Test 1: Get user info
  try {
    const userUrl = new URL('https://ws.audioscrobbler.com/2.0/')
    userUrl.searchParams.append('method', 'user.getInfo')
    userUrl.searchParams.append('api_key', apiKey!)
    userUrl.searchParams.append('sk', sessionKey)
    userUrl.searchParams.append('format', 'json')

    console.log('Fetching user info...')
    const userResponse = await fetch(userUrl.toString())
    const userData = await userResponse.json()
    console.log('User response status:', userResponse.status)
    console.log('User data:', JSON.stringify(userData, null, 2))

    if (userData.user) {
      const username = userData.user.name
      console.log('Username:', username)

      // Test 2: Get top albums
      const albumsUrl = new URL('https://ws.audioscrobbler.com/2.0/')
      albumsUrl.searchParams.append('method', 'user.getTopAlbums')
      albumsUrl.searchParams.append('api_key', apiKey!)
      albumsUrl.searchParams.append('user', username)
      albumsUrl.searchParams.append('limit', '10')
      albumsUrl.searchParams.append('period', '1month')
      albumsUrl.searchParams.append('format', 'json')

      console.log('Fetching top albums...')
      const albumsResponse = await fetch(albumsUrl.toString())
      const albumsData = await albumsResponse.json()
      console.log('Albums response status:', albumsResponse.status)
      console.log('Albums data:', JSON.stringify(albumsData, null, 2).substring(0, 500))
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

test()
