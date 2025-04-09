const apiRoot = 'http://localhost:3000/krater/api'

async function checkArtistsAndRelease({ artistIds, releaseId }) {
  try {
    const result = await fetch(
      `${apiRoot}/check?artistId=${artistIds.join(',')}&releaseId=${releaseId}`
    )
    const { missingArtists, missingRelease } = await result.json()
    return {
      missingArtists,
      missingRelease,
    }
  } catch (error) {
    return { error }
  }
}

async function addArtists(artistsInfo) {
  await fetch(`${apiRoot}/artists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(artistsInfo),
  })
}

async function addRelease(artistIds, update = false) {
  const title = document.querySelector('.album_title').innerText
  const rymId = document.querySelector('input.album_shortcut').value
  const rymUrl = window.location.origin + window.location.pathname
  const cover =
    document
      .querySelector('.page_release_art_frame img')
      .src.split('/')
      .slice(-1)[0]
      .split('.')[0] + '.webp'
  const spotify = document.querySelector('a.ui_media_link_btn_spotify').href

  const img = document.querySelector('.page_release_art_frame img')
  const response = await fetch(img.src)
  const blob = await response.blob()

  const formData = new FormData()

  formData.append('coverImage', blob, cover)
  formData.append('title', title)
  formData.append('rymId', rymId)
  formData.append('rymUrl', rymUrl)
  formData.append('cover', cover)
  formData.append('artistRymIds', JSON.stringify(artistIds))
  formData.append('media', JSON.stringify({ spotify }))

  await fetch(`${apiRoot}/releases`, {
    method: update ? 'PUT' : 'POST',
    body: formData,
  })
}

function createKraterBtn() {
  const kraterBtn = document.createElement('button')
  kraterBtn.style.all = 'unset'
  kraterBtn.style.background = '#303441'
  kraterBtn.style.padding = '8px 12px'
  kraterBtn.style.borderRadius = '4px'
  kraterBtn.style.color = '#b4b9c5'
  kraterBtn.style.cursor = 'pointer'
  kraterBtn.style.marginBottom = '12px'
  const pageSection = document.querySelector('.page_section')
  if (pageSection) {
    pageSection.prepend(kraterBtn)
  }
  return kraterBtn
}

function createRefreshBtn(artistIds) {
  const refreshBtn = document.createElement('button')
  refreshBtn.style.all = 'unset'
  refreshBtn.style.background = '#303441'
  refreshBtn.style.padding = '8px 12px'
  refreshBtn.style.borderRadius = '4px'
  refreshBtn.style.color = '#b4b9c5'
  refreshBtn.style.cursor = 'pointer'
  refreshBtn.style.marginBottom = '12px'
  refreshBtn.style.marginLeft = '12px'
  refreshBtn.textContent = 'Refresh data'
  refreshBtn.onclick = async () => {
    refreshBtn.textContent = '...'
    await addRelease(artistIds, true)
    refreshBtn.textContent = 'Refresh data'
  }
  return refreshBtn
}

function getArtistAndReleaseInfo() {
  const releaseId = document.querySelector('input.album_shortcut').value
  const artists = Array.from(document.querySelectorAll('.album_info a.artist')).map((artist) => ({
    displayName: artist.innerText,
    rymId: artist.title,
    rymUrl: artist.href,
  }))
  const artistIds = artists.map((artist) => artist.rymId)
  return {
    releaseId,
    artists,
    artistIds,
  }
}

async function removeRelease(releaseId) {
  await fetch(`${apiRoot}/releases?rymId=${releaseId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  })
}

async function loadKrater() {
  console.log('load krater')
  const { releaseId, artists, artistIds } = getArtistAndReleaseInfo()
  const { missingArtists, missingRelease, error } = await checkArtistsAndRelease({
    artistIds,
    releaseId,
  })
  if (error) {
    console.error(error)
    return
  }
  const kraterBtn = createKraterBtn()

  if (!missingRelease && (!missingArtists || !missingArtists.length)) {
    kraterBtn.innerText = 'Remove from Krater'
    kraterBtn.onclick = async () => {
      console.log('remove')
      if (!window.confirm('Do you want to remove this release from Krater?')) {
        return
      }

      await removeRelease(releaseId)
      window.location.reload()
    }

    kraterBtn.after(createRefreshBtn(artistIds))
  }

  if (missingRelease) {
    kraterBtn.innerText = 'Add to Krater'
    kraterBtn.onclick = async () => {
      if (!window.confirm('Do you want to add this release to Krater?')) {
        return
      }

      await addArtists(artists)
      await addRelease(artistIds)
      window.location.reload()
    }
  }
}

window.addEventListener('load', loadKrater)
