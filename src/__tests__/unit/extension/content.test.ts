import { readFileSync } from 'fs'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The content script is a classic script (no exports), so run its source against a stubbed `chrome`
const source = readFileSync('extension/content.js', 'utf8')

// Markup copied from real RYM release pages: joint album (artists in one row, IDs only in credits)
const jointAlbum = `
  <div class="page_section">
    <div class="album_title">Alfredo 2
      <input aria-label="album shortcut" class="album_shortcut" readonly value="[Album16544979]" />
      <div class="show-for-small album_artist_small">By <a href="/artist/freddie-gibbs" class="artist">Freddie Gibbs</a> &amp; <a href="/artist/the-alchemist-2" class="artist">The Alchemist</a></div>
    </div>
    <table class="album_info"><tr class="hide-for-small"><th class="info_hdr">Artist</th><td colspan="2"><span itemprop="byArtist" itemscope itemtype="http://schema.org/MusicGroup"><a itemprop="name" href="/artist/freddie-gibbs" class="artist">Freddie Gibbs</a> &amp; <a itemprop="name" href="/artist/the-alchemist-2" class="artist">The Alchemist</a></span></td></tr></table>
  </div>
  <div class="page_release_art_frame"><div class="hide-for-small">
    <img src="https://cdn.sonemic.net/i/600/s/e697c5ff7f1df1c37e919941812b4cb3/13566157/freddie-gibbs-and-the-alchemist-alfredo-2-Cover-Art.jpg" alt="Cover art" />
    <div id="media_link_button_container_top" data-links='{"spotify":{"5WrpCQmbTUZuzNxGCPUFSV":{"default":true,"type":"album"}},"applemusic":{"1824019687":{"default":true,"album":"alfredo-2","loc":"nz"}}}'></div>
  </div></div>`

// Solo album whose artist link has no title attribute and whose streaming buttons are not rendered
const soloAlbum = `
  <div class="page_section">
    <div class="album_title">The Patience
      <input class="album_shortcut" readonly value="[Album15350872]" />
      <div class="show-for-small album_artist_small">By <a href="/artist/mick-jenkins" class="artist">Mick Jenkins</a></div>
    </div>
    <table class="album_info"><tr class="hide-for-small"><th class="info_hdr">Artist</th><td colspan="2"><span itemprop="byArtist"><a itemprop="name" href="/artist/mick-jenkins" class="artist">Mick Jenkins</a></span></td></tr></table>
  </div>
  <div class="page_release_art_frame"><div class="hide-for-small">
    <img src="https://cdn.sonemic.net/i/600/s/b13f83e0be30b38d4a5a3ef428be3858/11120533/mick-jenkins-the-patience-Cover-Art.png" />
    <div id="media_link_button_container_top" data-links='{"spotify":{"7GlMEHJyohBhILSQYQIFgI":{"default":true,"type":"album"}}}'></div>
  </div></div>`

type Message = { type: string; [key: string]: unknown }

function runContentScript(html: string, respond: (message: Message) => object) {
  document.body.innerHTML = html
  const sent: Message[] = []
  vi.stubGlobal('chrome', {
    runtime: {
      sendMessage: vi.fn(async (message: Message) => {
        sent.push(message)
        return respond(message)
      }),
    },
    storage: {
      local: { get: vi.fn(async () => ({ isEnabled: true })) },
      onChanged: { addListener: vi.fn() },
    },
  })
  new Function(source)()
  return sent
}

const button = () => document.getElementById('krater-action-button') as HTMLButtonElement

async function buttonReady() {
  await vi.waitFor(() => expect(button()?.textContent).not.toMatch(/Loading/))
}

describe('content script', () => {
  beforeEach(() => {
    vi.stubGlobal('alert', vi.fn())
    ;(window as unknown as { happyDOM?: { setURL(url: string): void } }).happyDOM?.setURL(
      'https://rateyourmusic.com/release/album/freddie-gibbs-the-alchemist/alfredo-2-1/'
    )
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('checks the library with the release ID and the artist slugs of a joint album', async () => {
    const sent = runContentScript(jointAlbum, () => ({
      ok: true,
      exists: false,
      missingArtists: ['freddie-gibbs', 'the-alchemist-2'],
    }))
    await buttonReady()

    expect(sent[0]).toEqual({
      type: 'status',
      releaseId: '[Album16544979]',
      artistIds: ['freddie-gibbs', 'the-alchemist-2'],
    })
    expect(button().textContent).toBe('Add to Krater (incl. 2 artists)')
  })

  it('reads the artist from the link when it has no title attribute', async () => {
    const sent = runContentScript(soloAlbum, () => ({ ok: true, exists: false, missingArtists: [] }))
    await buttonReady()

    expect(sent[0]).toMatchObject({ artistIds: ['mick-jenkins'] })
    expect(button().textContent).toBe('Add to Krater')
  })

  it('sends the release, its artists, the cover URL, and the Spotify link when adding', async () => {
    const sent = runContentScript(jointAlbum, (message) =>
      message.type === 'status' ? { ok: true, exists: false, missingArtists: [] } : { ok: true }
    )
    await buttonReady()

    vi.stubGlobal('confirm', vi.fn(() => true))
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    button().click()
    await vi.waitFor(() => expect(sent.at(-1)?.type).toBe('save'))

    const save = sent.at(-1) as Message & { release: Record<string, unknown>; artists: unknown[] }
    expect(save.release).toMatchObject({
      title: 'Alfredo 2', // not "Alfredo 2 By Freddie Gibbs & The Alchemist"
      rymId: '[Album16544979]',
      coverUrl:
        'https://cdn.sonemic.net/i/600/s/e697c5ff7f1df1c37e919941812b4cb3/13566157/freddie-gibbs-and-the-alchemist-alfredo-2-Cover-Art.jpg',
      media: { spotify: 'https://open.spotify.com/album/5WrpCQmbTUZuzNxGCPUFSV' },
    })
    expect(save.artists).toEqual([
      {
        displayName: 'Freddie Gibbs',
        rymId: 'freddie-gibbs',
        rymUrl: 'https://rateyourmusic.com/artist/freddie-gibbs',
      },
      {
        displayName: 'The Alchemist',
        rymId: 'the-alchemist-2',
        rymUrl: 'https://rateyourmusic.com/artist/the-alchemist-2',
      },
    ])
  })

  it('does nothing when the confirmation is declined', async () => {
    const sent = runContentScript(soloAlbum, () => ({ ok: true, exists: false, missingArtists: [] }))
    await buttonReady()

    vi.stubGlobal('confirm', vi.fn(() => false))
    button().click()

    expect(sent.map((m) => m.type)).toEqual(['status'])
  })

  it('offers remove and refresh for a release that is already in the library', async () => {
    const sent = runContentScript(soloAlbum, (message) =>
      message.type === 'status' ? { ok: true, exists: true, missingArtists: [] } : { ok: true }
    )
    await buttonReady()

    expect(button().textContent).toBe('Remove from Krater')
    expect(document.getElementById('krater-refresh-button')).not.toBeNull()

    vi.stubGlobal('confirm', vi.fn(() => true))
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    button().click()
    await vi.waitFor(() => expect(sent.at(-1)).toEqual({ type: 'remove', releaseId: '[Album15350872]' }))
  })

  it('tells you the dev server is offline', async () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    runContentScript(soloAlbum, () => ({
      ok: false,
      error: 'Can\'t reach Krater. Run "npm run dev" in your Krater clone.',
      helperDown: true,
    }))
    await buttonReady()

    expect(button().textContent).toBe('Krater dev server offline')
    expect(button().title).toContain('npm run dev')
    expect(button().disabled).toBe(false)
  })

  it('asks for site access when the browser blocks a running dev server', async () => {
    const sent = runContentScript(soloAlbum, (message) =>
      message.type === 'status'
        ? { ok: false, error: 'Krater is running, but the browser blocked it.', blocked: true }
        : { ok: true }
    )
    await buttonReady()

    expect(button().textContent).toBe('Krater needs site access')
    expect(button().disabled).toBe(false)
    button().click()
    await vi.waitFor(() => expect(sent.at(-1)).toEqual({ type: 'openOptions' }))
  })

  it('shows an error state instead of throwing when the library cannot be checked', async () => {
    runContentScript(soloAlbum, () => ({ ok: false, error: 'GitHub 500' }))
    await buttonReady()

    expect(button().textContent).toBe('Krater error')
    expect(button().title).toBe('GitHub 500')
  })

  it('does not add a button when the page has no release', async () => {
    const sent = runContentScript('<div class="page_section"></div>', () => ({ ok: true }))
    await vi.waitFor(() => expect(document.getElementById('krater-action-button')).toBeNull())
    expect(sent).toEqual([])
  })
})
