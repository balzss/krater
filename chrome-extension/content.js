// Inject a button into the page
window.addEventListener('load', () => {
  const button = document.createElement('button')
  button.innerText = 'Check & Add Release'
  button.style.margin = '10px'
  button.style.padding = '10px'
  button.style.fontSize = '14px'
  button.style.cursor = 'pointer'

  const pageSection = document.querySelector('.page_section')
  if (pageSection) {
    pageSection.prepend(button)
  }

  button.addEventListener('click', async () => {
    const albumId = document.querySelector('input.album_shortcut').value
    const artists = Array.from(document.querySelectorAll('.album_info a.artist')).map((artist) => ({
      displayName: artist.innerText,
      rymId: artist.title,
      rymUrl: artist.href,
    }))
    const artistIds = artists.map((artist) => artist.rymId)

    if (albumId && artistIds.length) {
      // Check if the artist and release are already stored
      const checkResponse = await fetch(
        `http://localhost:3000/krater/api/check?artistId=${artistIds.join(',')}&releaseId=${albumId}`
      )
      const checkData = await checkResponse.json()

      const artistsToAdd = []
      const missingRelease = checkData.missingRelease
      if (checkData.missingArtists.length) {
        artistsToAdd.push(...artists.filter((a) => checkData.missingArtists.includes(a.rymId)))
      }
      console.log({ artistsToAdd })

      if (artistsToAdd.length) {
        artistsToAdd.forEach(async (artist) => {
          const missingArtistsConfirmMsg = `${artist.displayName} is missing from you library. Would you like to add them?`
          if (window.confirm(missingArtistsConfirmMsg)) {
            await fetch('http://localhost:3000/krater/api/artists', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                addArtist: artist,
              }),
            })
          }
        })
      }

      return

      if (checkData.message === 'Artist found' && checkData.message === 'Release found') {
        alert('Artist and Release are already stored.')
      } else {
        console.log({ checkData, artists })
        alert(checkData)
        return
        // Add artist and release if not found
        await fetch('http://localhost:3000/krater/api/releases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            artistRymIds: artistIds,
            title: document.querySelector('h1').innerText,
            rymId: albumId,
            cover: document.querySelector('img.cover_art').src, // You can get cover URL dynamically
            media: {
              spotify: document.querySelector('a[href*="spotify.com"]').href,
            },
          }),
        })

        await fetch('http://localhost:3000/krater/api/artists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rymId: artistIds,
            displayName: document.querySelector('h1').innerText,
          }),
        })

        alert('Artist and Release have been added.')
      }
    } else {
      alert('Missing album or artist info!')
    }
  })
})
