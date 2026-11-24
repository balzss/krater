// @vitest-environment node
import fs from 'fs'
import os from 'os'
import path from 'path'
import http from 'http'
import type { AddressInfo } from 'net'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http as mswHttp, passthrough } from 'msw'
import { createServer as createViteServer } from 'vite'
import { createHelperHandler, kraterHelperPlugin } from '../../../../scripts/library-helper.js'
import { validateLibrary } from '../../../../scripts/validate-library.js'
import { server as mockServer } from '../../../../vitest.setup'
import { mockLibraryData } from '../../mocks/data'

const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([4, 0, 0, 0]),
  Buffer.from('WEBP'),
  Buffer.from('VP8 payload'),
])
const COVER_URL =
  'https://cdn.sonemic.net/i/600/s/abc/1/freddie-gibbs-and-the-alchemist-alfredo-2-Cover-Art.jpg'

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
const COVER_FILE = 'freddie-gibbs-and-the-alchemist-alfredo-2-Cover-Art.webp'

let root: string
let server: http.Server
let port: number
let onChange: ReturnType<typeof vi.fn>

const libraryFile = () => path.join(root, 'public/data/libraryData.json')
const coversDir = () => path.join(root, 'public/covers')
const readLibrary = () => JSON.parse(fs.readFileSync(libraryFile(), 'utf8'))

function post(
  endpoint: string,
  body: unknown,
  headers: Record<string, string> = { 'X-Krater': '1' },
  targetPort = port
): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const payload = typeof body === 'string' ? body : JSON.stringify(body)
    const request = http.request(
      {
        host: '127.0.0.1',
        port: targetPort,
        path: endpoint,
        method: 'POST',
        headers: { ...headers },
      },
      (response) => {
        let text = ''
        response.on('data', (chunk) => (text += chunk))
        response.on('end', () => resolve({ status: response.statusCode!, body: JSON.parse(text) }))
      }
    )
    request.on('error', reject)
    request.end(payload)
  })
}

beforeEach(async () => {
  // The suite blocks unmocked requests, but this test talks to its own local server
  mockServer.use(mswHttp.all(/^http:\/\/127\.0\.0\.1:\d+\//, () => passthrough()))

  root = fs.mkdtempSync(path.join(os.tmpdir(), 'krater-helper-'))
  fs.mkdirSync(path.join(root, 'public/data'), { recursive: true })
  fs.mkdirSync(coversDir(), { recursive: true })
  // The stored file has no trailing newline, like the real one
  fs.writeFileSync(libraryFile(), JSON.stringify(mockLibraryData, null, 2))
  for (const { cover } of mockLibraryData.releases)
    fs.writeFileSync(path.join(coversDir(), cover), 'x')

  onChange = vi.fn()
  server = http.createServer(createHelperHandler({ root, onChange }))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  port = (server.address() as AddressInfo).port
})

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve))
  fs.rmSync(root, { recursive: true, force: true })
})

describe('library helper', () => {
  describe('/status', () => {
    it('reports an existing release and the artists the library lacks', async () => {
      const { status, body } = await post('/status', {
        releaseId: 'ok-computer',
        artistIds: ['radiohead', 'newcomer'],
      })

      expect(status).toBe(200)
      expect(body).toEqual({ ok: true, exists: true, missingArtists: ['newcomer'] })
    })

    it('reports a release it does not have', async () => {
      const { body } = await post('/status', { releaseId: '[Album1]', artistIds: [] })
      expect(body).toMatchObject({ exists: false })
    })

    it('rejects a request without the fields it needs', async () => {
      expect((await post('/status', {})).status).toBe(400)
    })
  })

  describe('/save', () => {
    it('writes the cover and adds the release and artists to the library', async () => {
      const { status, body } = await post('/save', {
        release,
        artists,
        coverBase64: WEBP.toString('base64'),
      })

      expect(status).toBe(200)
      expect(body).toEqual({ ok: true, replaced: false })
      expect(fs.readFileSync(path.join(coversDir(), COVER_FILE))).toEqual(WEBP)

      const library = readLibrary()
      expect(library.releases.at(-1)).toMatchObject({
        title: 'Alfredo 2',
        cover: COVER_FILE,
        artistRymIds: ['freddie-gibbs'],
      })
      expect(library.artists.at(-1)).toMatchObject({ rymId: 'freddie-gibbs' })
      expect(validateLibrary(library, { coverFiles: fs.readdirSync(coversDir()) }).errors).toEqual(
        []
      )
    })

    it('keeps the file format it found (no trailing newline)', async () => {
      await post('/save', { release, artists, coverBase64: WEBP.toString('base64') })
      expect(fs.readFileSync(libraryFile(), 'utf8').endsWith('\n')).toBe(false)
    })

    it('updates a release that is already there', async () => {
      const first = { release, artists, coverBase64: WEBP.toString('base64') }
      await post('/save', first)

      const { body } = await post('/save', {
        ...first,
        release: { ...release, title: 'Alfredo II' },
      })

      expect(body).toMatchObject({ replaced: true })
      const matching = readLibrary().releases.filter(
        (r: { rymId: string }) => r.rymId === release.rymId
      )
      expect(matching).toHaveLength(1)
      expect(matching[0].title).toBe('Alfredo II')
    })

    it('refuses a cover that is not a WebP image and changes nothing', async () => {
      const before = fs.readFileSync(libraryFile(), 'utf8')

      const { status, body } = await post('/save', {
        release,
        artists,
        coverBase64: Buffer.from('<?php evil ?>').toString('base64'),
      })

      expect(status).toBe(400)
      expect(body.error).toBe('The cover is not a WebP image')
      expect(fs.readFileSync(libraryFile(), 'utf8')).toBe(before)
      expect(fs.existsSync(path.join(coversDir(), COVER_FILE))).toBe(false)
    })

    it('refuses an edit that would break the library and writes nothing', async () => {
      const before = fs.readFileSync(libraryFile(), 'utf8')

      const { status, body } = await post('/save', {
        release: { ...release, media: { spotify: 'not a url' } },
        artists,
        coverBase64: WEBP.toString('base64'),
      })

      expect(status).toBe(422)
      expect(body.error).toContain('media.spotify is not a valid URL')
      expect(fs.readFileSync(libraryFile(), 'utf8')).toBe(before)
      expect(fs.existsSync(path.join(coversDir(), COVER_FILE))).toBe(false)
    })

    it('never writes outside the covers folder', async () => {
      const { status } = await post('/save', {
        release: { ...release, coverUrl: 'https://cdn.sonemic.net/1/..%2F..%2Fevil.png' },
        artists,
        coverBase64: WEBP.toString('base64'),
      })

      expect(status).toBe(200)
      expect(fs.existsSync(path.join(root, 'evil.webp'))).toBe(false)
      expect(fs.existsSync(path.join(root, 'public', 'evil.webp'))).toBe(false)
      expect(fs.existsSync(path.join(coversDir(), '..-..-evil.webp'))).toBe(true)
    })

    it('rejects a request without the fields it needs', async () => {
      expect((await post('/save', { release: {}, artists })).status).toBe(400)
    })
  })

  describe('/remove', () => {
    it('removes the release, its cover file, and artists nothing else uses', async () => {
      const { status } = await post('/remove', { releaseId: 'ok-computer' })

      expect(status).toBe(200)
      const library = readLibrary()
      expect(library.releases.map((r: { rymId: string }) => r.rymId)).not.toContain('ok-computer')
      expect(library.artists.map((a: { rymId: string }) => a.rymId)).not.toContain('radiohead')
      expect(fs.existsSync(path.join(coversDir(), 'ok-computer.jpg'))).toBe(false)
      expect(validateLibrary(library, { coverFiles: fs.readdirSync(coversDir()) }).errors).toEqual(
        []
      )
    })

    it('answers 404 for a release it does not have', async () => {
      const { status, body } = await post('/remove', { releaseId: 'nope' })
      expect(status).toBe(404)
      expect(body.error).toBe('This release is not in the library')
    })
  })

  describe('change notifications', () => {
    const save = { release, artists, coverBase64: WEBP.toString('base64') }

    it('announces a successful save and a successful remove', async () => {
      await post('/save', save)
      expect(onChange).toHaveBeenCalledTimes(1)

      await post('/remove', { releaseId: release.rymId })
      expect(onChange).toHaveBeenCalledTimes(2)
    })

    it('stays quiet for reads and for edits that were refused', async () => {
      await post('/status', { releaseId: 'ok-computer', artistIds: [] })
      await post('/save', { ...save, coverBase64: Buffer.from('nope').toString('base64') })
      await post('/remove', { releaseId: 'nope' })

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('access control', () => {
    const payload = { releaseId: 'ok-computer', artistIds: [] }

    it('rejects requests without the X-Krater header', async () => {
      expect((await post('/status', payload, {})).status).toBe(403)
    })

    it('rejects requests from web pages', async () => {
      const { status } = await post('/status', payload, {
        'X-Krater': '1',
        Origin: 'https://evil.example.com',
      })
      expect(status).toBe(403)
    })

    it.each(['chrome-extension://abcdef', 'moz-extension://1234-5678'])(
      'accepts requests from %s',
      async (origin) => {
        expect((await post('/status', payload, { 'X-Krater': '1', Origin: origin })).status).toBe(
          200
        )
      }
    )

    it('rejects an unexpected Host header (DNS rebinding)', async () => {
      const { status } = await post('/status', payload, {
        'X-Krater': '1',
        Host: 'evil.example.com',
      })
      expect(status).toBe(403)
    })

    it('answers 404 for unknown routes', async () => {
      expect((await post('/nope', {})).status).toBe(404)
    })

    it('rejects a body that is not JSON', async () => {
      expect((await post('/status', 'not json')).status).toBe(400)
    })

    it('rejects a body that declares an oversized length without reading it', async () => {
      const { status } = await post(
        '/save',
        {},
        { 'X-Krater': '1', 'Content-Length': String(11 * 1024 * 1024) }
      )
      expect(status).toBe(413)
    })
  })
})

describe('dev server plugin', () => {
  it('only applies to the dev server, never to a production build', () => {
    expect(kraterHelperPlugin().apply).toBe('serve')
  })

  it('serves the helper under /__krater of a running Vite dev server', async () => {
    const vite = await createViteServer({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [kraterHelperPlugin()],
      server: { host: '127.0.0.1', port: 0, ws: false },
      optimizeDeps: { noDiscovery: true },
    })
    await vite.listen()
    const vitePort = (vite.httpServer!.address() as AddressInfo).port

    try {
      const status = await post(
        '/__krater/status',
        { releaseId: 'ok-computer', artistIds: ['radiohead'] },
        { 'X-Krater': '1' },
        vitePort
      )
      expect(status.body).toEqual({ ok: true, exists: true, missingArtists: [] })

      const saved = await post(
        '/__krater/save',
        { release, artists, coverBase64: WEBP.toString('base64') },
        { 'X-Krater': '1', Origin: 'chrome-extension://abc' },
        vitePort
      )
      expect(saved.status).toBe(200)
      expect(readLibrary().releases.at(-1).rymId).toBe('[Album16544979]')

      // The same protections apply behind Vite
      const rejected = await post(
        '/__krater/status',
        {},
        { 'X-Krater': '1', Origin: 'https://evil.example.com' },
        vitePort
      )
      expect(rejected.status).toBe(403)
    } finally {
      await vite.close()
    }
  })
})
