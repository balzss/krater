import { callHelper, isLocalHelperUrl, DEFAULT_HELPER_URL, HelperError } from './lib/helper.js'

const api = globalThis.browser ?? globalThis.chrome

async function getHelperUrl() {
  const { helperUrl } = await api.storage.local.get({ helperUrl: DEFAULT_HELPER_URL })
  if (!isLocalHelperUrl(helperUrl)) {
    throw new HelperError(`The helper URL "${helperUrl}" must be http://127.0.0.1 or http://localhost`)
  }
  return helperUrl
}

// Chrome's service worker has no FileReader for this, so encode by hand
function toBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

async function fetchCoverAsWebp(coverUrl) {
  const response = await fetch(coverUrl)
  if (!response.ok) throw new Error(`Failed to fetch the cover image: ${response.status}`)

  const bitmap = await createImageBitmap(await response.blob())
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  canvas.getContext('2d').drawImage(bitmap, 0, 0)
  const webp = await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 })
  if (webp.type !== 'image/webp') throw new Error('This browser cannot encode WebP images.')

  return toBase64(new Uint8Array(await webp.arrayBuffer()))
}

const handlers = {
  async status({ releaseId, artistIds }) {
    const { exists, missingArtists } = await callHelper(await getHelperUrl(), '/status', {
      releaseId,
      artistIds,
    })
    return { exists, missingArtists }
  },

  async save({ release, artists }) {
    const helperUrl = await getHelperUrl()
    // Convert first so a failure here leaves the library untouched
    const coverBase64 = await fetchCoverAsWebp(release.coverUrl)
    await callHelper(helperUrl, '/save', { release, artists, coverBase64 })
    return {}
  },

  async remove({ releaseId }) {
    await callHelper(await getHelperUrl(), '/remove', { releaseId })
    return {}
  },

  async openOptions() {
    await api.runtime.openOptionsPage()
    return {}
  },
}

api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handler = handlers[message?.type]
  if (!handler) return false

  handler(message)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => {
      console.error('Krater Extension:', error)
      sendResponse({
        ok: false,
        error: error.message,
        helperDown: Boolean(error.unreachable),
        blocked: Boolean(error.blocked),
      })
    })
  return true // keep the channel open for the async response
})

// The toolbar icon opens the settings
api.action.onClicked.addListener(() => api.runtime.openOptionsPage())

// Earlier builds stored a GitHub token, and a standalone helper on port 4747. Neither is used anymore.
api.storage.local.remove(['repo', 'branch', 'token'])
api.storage.local.get({ helperUrl: '' }).then(({ helperUrl }) => {
  if (helperUrl === 'http://127.0.0.1:4747') api.storage.local.remove('helperUrl')
})
