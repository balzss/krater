// Runs on RateYourMusic release pages. Reads the release from the page and asks the background
// script to add it to your library through the local Krater helper.

const api = globalThis.browser ?? globalThis.chrome

async function send(message) {
  const response = await api.runtime.sendMessage(message)
  if (!response?.ok) {
    const error = new Error(response?.error || 'No response from the Krater extension')
    error.helperDown = Boolean(response?.helperDown)
    error.blocked = Boolean(response?.blocked)
    throw error
  }
  return response
}

// --- Data Extraction ---

const slugFromUrl = (url) => new URL(url).pathname.split('/').filter(Boolean).pop()

function getArtistAndReleaseInfo() {
  const releaseId = document.querySelector('input.album_shortcut')?.value

  // RYM no longer exposes artist IDs on release pages, so the URL slug is the artist key
  const artists = Array.from(document.querySelectorAll('.album_info a.artist')).map((artist) => ({
    displayName: artist.innerText,
    rymId: slugFromUrl(artist.href),
    rymUrl: artist.href,
  }))

  if (!releaseId || artists.length === 0) {
    console.error('Krater Extension: Could not extract a release ID or artists from the page.')
    return null
  }

  return { releaseId, artists, artistIds: artists.map((artist) => artist.rymId) }
}

// The title is the text of .album_title itself, without the mobile "By <artist>" line inside it
function getTitle() {
  const element = document.querySelector('.album_title')
  if (!element) return null
  const ownText = Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent)
    .join('')
    .trim()
  return ownText || element.innerText.trim()
}

// RYM renders its streaming buttons lazily, so fall back to the data it renders them from
function getSpotifyFromData() {
  try {
    const links = JSON.parse(
      document.querySelector('#media_link_button_container_top')?.dataset.links || '{}'
    )
    const albumId = Object.entries(links.spotify || {}).find(
      ([, info]) => info.type === 'album'
    )?.[0]
    return albumId ? `https://open.spotify.com/album/${albumId}` : null
  } catch (_e) {
    return null
  }
}

function extractMediaLinks() {
  const services = {
    spotify: 'a.ui_media_link_btn_spotify',
    appleMusic: 'a.ui_media_link_btn_applemusic',
    youtube: 'a.ui_media_link_btn_youtube',
    bandcamp: 'a.ui_media_link_btn_bandcamp',
    soundcloud: 'a.ui_media_link_btn_soundcloud',
    tidal: 'a.ui_media_link_btn_tidal',
    deezer: 'a.ui_media_link_btn_deezer',
  }

  const media = {}
  for (const [service, selector] of Object.entries(services)) {
    const href = document.querySelector(selector)?.href
    if (href) media[service] = href
  }
  if (!media.spotify) {
    const spotify = getSpotifyFromData()
    if (spotify) media.spotify = spotify
  }
  return media
}

function getRelease() {
  const release = {
    title: getTitle(),
    rymId: document.querySelector('input.album_shortcut')?.value,
    rymUrl: window.location.origin + window.location.pathname,
    coverUrl: document.querySelector('.page_release_art_frame img')?.src,
    media: extractMediaLinks(),
  }

  if (!release.title || !release.rymId || !release.coverUrl) {
    throw new Error('Could not find the title, RYM ID, or cover on this page.')
  }
  return release
}

// --- UI Functions (Using CSS Classes) ---

function createKraterBtn() {
  const kraterBtn = document.createElement('button')
  kraterBtn.id = 'krater-action-button'
  kraterBtn.classList.add('krater-button', 'krater-button-loading')
  kraterBtn.textContent = 'Loading Krater...'
  kraterBtn.disabled = true

  const pageSection = document.querySelector('.page_section') // Target for button insertion
  if (pageSection) {
    pageSection.prepend(kraterBtn)
  } else {
    console.warn("Krater Extension: Could not find '.page_section' to insert button.")
  }
  return kraterBtn
}

function createRefreshBtn(onClick) {
  const refreshBtn = document.createElement('button')
  refreshBtn.id = 'krater-refresh-button'
  refreshBtn.classList.add('krater-button', 'krater-button-refresh')
  refreshBtn.textContent = 'Refresh data'
  refreshBtn.onclick = onClick
  return refreshBtn
}

// Runs an action behind a button: busy label while it works, a message when it ends
async function runAction(button, { busyText, doneText, action, reload = true }) {
  const originalText = button.textContent
  button.textContent = busyText
  button.disabled = true

  try {
    await action()
    button.textContent = doneText
    if (reload) {
      setTimeout(() => window.location.reload(), 800)
    } else {
      setTimeout(() => {
        button.textContent = originalText
        button.disabled = false
      }, 1500)
    }
  } catch (error) {
    console.error('Krater Extension:', error)
    alert(error.message)
    button.textContent = 'Failed'
    setTimeout(() => {
      button.textContent = originalText
      button.disabled = false
    }, 3000)
  }
}

// --- Main Logic ---

async function loadKrater() {
  const kraterBtn = createKraterBtn()

  const releaseInfo = getArtistAndReleaseInfo()
  if (!releaseInfo) {
    kraterBtn.remove()
    return
  }
  const { releaseId, artists, artistIds } = releaseInfo

  let status
  try {
    status = await send({ type: 'status', releaseId, artistIds })
  } catch (error) {
    kraterBtn.classList.remove('krater-button-loading')
    kraterBtn.classList.add('krater-button-error')
    kraterBtn.title = error.message
    if (error.blocked) {
      // Krater is running, but the browser has not given the extension access to it
      kraterBtn.textContent = 'Krater needs site access'
      kraterBtn.disabled = false
      kraterBtn.onclick = () => send({ type: 'openOptions' })
    } else if (error.helperDown) {
      // Nothing to do in the page: start `npm run dev`, then click to check again
      kraterBtn.textContent = 'Krater dev server offline'
      kraterBtn.disabled = false
      kraterBtn.onclick = () => window.location.reload()
    } else {
      console.error('Krater Extension: Failed to check the library.', error)
      kraterBtn.textContent = 'Krater error'
    }
    return
  }

  kraterBtn.classList.remove('krater-button-loading')
  kraterBtn.disabled = false

  const save = () => send({ type: 'save', release: getRelease(), artists })

  if (status.exists) {
    kraterBtn.innerText = 'Remove from Krater'
    kraterBtn.classList.add('krater-button-remove')
    kraterBtn.onclick = () => {
      if (!window.confirm('Do you want to remove this release from Krater?')) return
      runAction(kraterBtn, {
        busyText: 'Removing...',
        doneText: 'Removed',
        action: () => send({ type: 'remove', releaseId }),
      })
    }

    // Refresh only makes sense for something that is already in the library
    const refreshBtn = createRefreshBtn(() => {
      if (
        !window.confirm('Do you want to refresh the release data in Krater with the current page info?')
      ) {
        return
      }
      runAction(refreshBtn, {
        busyText: 'Refreshing...',
        doneText: 'Refreshed!',
        action: save,
        reload: false,
      })
    })
    kraterBtn.after(refreshBtn)
    return
  }

  const { missingArtists } = status
  kraterBtn.innerText =
    missingArtists.length > 0
      ? `Add to Krater (incl. ${missingArtists.length} artist${missingArtists.length > 1 ? 's' : ''})`
      : 'Add to Krater'
  kraterBtn.classList.add('krater-button-add')
  kraterBtn.onclick = () => {
    const extra = missingArtists.length > 0 ? ' (and missing artists)' : ''
    if (!window.confirm(`Do you want to add this release${extra} to Krater?`)) return
    runAction(kraterBtn, { busyText: 'Adding...', doneText: 'Added', action: save })
  }
}

// --- Initialization ---

async function initializeKraterExtension() {
  if (document.getElementById('krater-action-button')) return // already injected

  const { isEnabled } = await api.storage.local.get({ isEnabled: true })
  if (!isEnabled) {
    console.log('Krater Extension is disabled via settings.')
    return
  }
  loadKrater()
}

initializeKraterExtension()

// Settings changed on the options page: reload so the page reflects them
api.storage.onChanged.addListener((_changes, area) => {
  if (area === 'local') window.location.reload()
})
