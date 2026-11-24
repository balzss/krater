import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type Message = { type: string; [key: string]: unknown }
type Response = {
  ok: boolean
  error?: string
  helperDown?: boolean
  blocked?: boolean
  [key: string]: unknown
}
type HelperCall = { endpoint: string; headers: Record<string, string>; body: Record<string, unknown> }

const COVER_URL =
  'https://cdn.sonemic.net/i/600/s/abc/1/freddie-gibbs-and-the-alchemist-alfredo-2-Cover-Art.jpg'
const HELPER = 'http://127.0.0.1:5173'

const release = {
  title: 'Alfredo 2',
  rymId: '[Album16544979]',
  rymUrl: 'https://rateyourmusic.com/release/album/freddie-gibbs-the-alchemist/alfredo-2-1/',
  coverUrl: COVER_URL,
  media: { spotify: 'https://open.spotify.com/album/5WrpCQmbTUZuzNxGCPUFSV' },
}
const artists = [
  {
    displayName: 'Freddie Gibbs',
    rymId: 'freddie-gibbs',
    rymUrl: 'https://rateyourmusic.com/artist/freddie-gibbs',
  },
]

/** Stubs fetch: the cover CDN plus a fake helper whose answers the test controls */
function stubNetwork({
  helper = (_call: HelperCall) => new Response(JSON.stringify({ ok: true })),
  cover = () => new Response(new Uint8Array([9, 9, 9])),
  helperDown = false,
  blocked = false, // the server answers, but the browser refuses the extension's request
} = {}) {
  const helperCalls: HelperCall[] = []
  const coverRequests: string[] = []

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      if (url.startsWith(HELPER)) {
        if (url === HELPER) {
          // the plain probe that tells "not running" from "not allowed"
          if (helperDown) throw new TypeError('Failed to fetch')
          return new Response(null)
        }
        if (helperDown || blocked) throw new TypeError('Failed to fetch')
        const call = {
          endpoint: url.slice(`${HELPER}/__krater`.length),
          headers: init.headers as Record<string, string>,
          body: JSON.parse(init.body as string),
        }
        helperCalls.push(call)
        return helper(call)
      }
      coverRequests.push(url)
      return cover()
    })
  )
  return { helperCalls, coverRequests }
}

let dispatch: (message: Message) => Promise<Response>
let storageRemove: ReturnType<typeof vi.fn>

async function loadBackground(settings: Record<string, unknown> = { helperUrl: HELPER }) {
  vi.resetModules()
  const listeners: Array<(m: Message, s: unknown, send: (r: Response) => void) => boolean> = []
  storageRemove = vi.fn()
  vi.stubGlobal('chrome', {
    storage: { local: { get: vi.fn(async () => settings), remove: storageRemove } },
    runtime: {
      onMessage: { addListener: (fn: (typeof listeners)[number]) => listeners.push(fn) },
      openOptionsPage: vi.fn(async () => {}),
    },
    action: { onClicked: { addListener: vi.fn() } },
  })
  await import('../../../../extension/background.js')
  dispatch = (message) => new Promise((resolve) => listeners[0](message, {}, resolve))
}

const webpCanvas = (type: string) =>
  class {
    getContext() {
      return { drawImage() {} }
    }
    async convertToBlob() {
      return new Blob([new Uint8Array([1, 2, 3])], { type })
    }
  }

describe('extension background', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 2, height: 2 })))
    vi.stubGlobal('OffscreenCanvas', webpCanvas('image/webp'))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('asks the helper whether the release exists and which artists are new', async () => {
    const { helperCalls } = stubNetwork({
      helper: () =>
        new Response(JSON.stringify({ ok: true, exists: true, missingArtists: ['new-one'] })),
    })
    await loadBackground()

    const response = await dispatch({
      type: 'status',
      releaseId: 'ok-computer',
      artistIds: ['radiohead', 'new-one'],
    })

    expect(response).toEqual({ ok: true, exists: true, missingArtists: ['new-one'] })
    expect(helperCalls).toEqual([
      {
        endpoint: '/status',
        headers: { 'Content-Type': 'application/json', 'X-Krater': '1' },
        body: { releaseId: 'ok-computer', artistIds: ['radiohead', 'new-one'] },
      },
    ])
  })

  it('converts the cover to WebP and sends everything to the helper to save', async () => {
    const { helperCalls, coverRequests } = stubNetwork()
    await loadBackground()

    expect(await dispatch({ type: 'save', release, artists })).toEqual({ ok: true })

    expect(coverRequests).toEqual([COVER_URL])
    expect(helperCalls).toHaveLength(1)
    expect(helperCalls[0].endpoint).toBe('/save')
    expect(helperCalls[0].body).toEqual({ release, artists, coverBase64: 'AQID' }) // bytes [1, 2, 3]
  })

  it('fails clearly, and sends nothing, when the browser cannot encode WebP', async () => {
    const { helperCalls } = stubNetwork()
    vi.stubGlobal('OffscreenCanvas', webpCanvas('image/png'))
    await loadBackground()

    expect(await dispatch({ type: 'save', release, artists })).toMatchObject({
      ok: false,
      error: 'This browser cannot encode WebP images.',
    })
    expect(helperCalls).toEqual([])
  })

  it('fails clearly, and sends nothing, when the cover cannot be downloaded', async () => {
    const { helperCalls } = stubNetwork({ cover: () => new Response('', { status: 404 }) })
    await loadBackground()

    expect(await dispatch({ type: 'save', release, artists })).toMatchObject({
      ok: false,
      error: 'Failed to fetch the cover image: 404',
    })
    expect(helperCalls).toEqual([])
  })

  it('tells the user to start the dev server when it is not running', async () => {
    stubNetwork({ helperDown: true })
    await loadBackground()

    const response = await dispatch({ type: 'status', releaseId: 'x', artistIds: [] })

    expect(response).toMatchObject({ ok: false, helperDown: true })
    expect(response.error).toContain('npm run dev')
  })

  it('says so when the browser blocks the extension from a running dev server', async () => {
    stubNetwork({ blocked: true })
    await loadBackground()

    const response = await dispatch({ type: 'status', releaseId: 'x', artistIds: [] })

    expect(response).toMatchObject({ ok: false, blocked: true, helperDown: false })
    expect(response.error).toContain('site access')
  })

  it("shows the helper's own error message", async () => {
    stubNetwork({
      helper: () =>
        new Response(JSON.stringify({ ok: false, error: 'The library would be invalid: x' }), {
          status: 422,
        }),
    })
    await loadBackground()

    expect(await dispatch({ type: 'save', release, artists })).toEqual({
      ok: false,
      error: 'The library would be invalid: x',
      helperDown: false,
      blocked: false,
    })
  })

  it('asks the helper to remove a release', async () => {
    const { helperCalls } = stubNetwork()
    await loadBackground()

    expect(await dispatch({ type: 'remove', releaseId: '[Album1]' })).toEqual({ ok: true })
    expect(helperCalls).toEqual([
      expect.objectContaining({ endpoint: '/remove', body: { releaseId: '[Album1]' } }),
    ])
  })

  it('refuses a helper URL that is not on this machine', async () => {
    const fetchMock = stubNetwork()
    await loadBackground({ helperUrl: 'https://evil.example.com' })

    const response = await dispatch({ type: 'status', releaseId: 'x', artistIds: [] })

    expect(response).toMatchObject({ ok: false })
    expect(response.error).toContain('127.0.0.1')
    expect(fetchMock.helperCalls).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('deletes the GitHub token an earlier version stored', async () => {
    stubNetwork()
    await loadBackground()

    expect(storageRemove).toHaveBeenCalledWith(['repo', 'branch', 'token'])
  })

  it('forgets the old standalone helper address so the new default applies', async () => {
    stubNetwork()
    await loadBackground({ helperUrl: 'http://127.0.0.1:4747' })

    await vi.waitFor(() => expect(storageRemove).toHaveBeenCalledWith('helperUrl'))
  })

  it('keeps a helper address the user chose', async () => {
    stubNetwork()
    await loadBackground({ helperUrl: 'http://localhost:5173' })
    await dispatch({ type: 'openOptions' })

    expect(storageRemove).not.toHaveBeenCalledWith('helperUrl')
  })

  it('opens the settings page on request', async () => {
    stubNetwork()
    await loadBackground()

    expect(await dispatch({ type: 'openOptions' })).toEqual({ ok: true })
  })
})
