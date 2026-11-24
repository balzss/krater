import fs from 'fs'
import path from 'path'
import {
  LIBRARY_PATH,
  COVERS_DIR,
  coverFileName,
  hasRelease,
  findMissingArtists,
  upsertRelease,
  removeRelease,
  serializeLibrary,
} from '../extension/lib/library.js'
import { validateLibrary } from './validate-library.js'

/**
 * Library Helper
 * The part of the dev server the browser extension talks to. It edits public/data/libraryData.json
 * and public/covers/ in this clone and never touches git, so you review and commit the changes yourself.
 *
 * Only the extension may use it. It rejects requests from web pages and validates the library
 * before writing anything. It exists only while the dev server runs (`npm run dev`).
 */

/** Where the dev server mounts the helper */
export const HELPER_PATH = '/__krater'

const MAX_BODY_BYTES = 10 * 1024 * 1024

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function assertInput(condition) {
  if (!condition) throw new HttpError(400, 'Request is missing required fields')
}

const isExtensionOrigin = (origin) =>
  origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')

function isWebp(buffer) {
  return (
    buffer.length > 12 &&
    buffer.toString('latin1', 0, 4) === 'RIFF' &&
    buffer.toString('latin1', 8, 12) === 'WEBP'
  )
}

async function readJson(req) {
  // Refuse up front when the size is declared, so a huge upload is never read
  if (Number(req.headers['content-length']) > MAX_BODY_BYTES) {
    throw new HttpError(413, 'Request is too large')
  }

  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'Request is too large')
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'Request body is not valid JSON')
  }
}

/**
 * Creates the request handler for the repository at `root`. The routes are relative to wherever it
 * is mounted, so `/status` means `<mount>/status`. `onChange` runs after every successful write.
 */
export function createHelperHandler({ root, onChange }) {
  const libraryFile = path.join(root, LIBRARY_PATH)
  const coversDir = path.join(root, COVERS_DIR)

  const readLibrary = () => {
    const text = fs.readFileSync(libraryFile, 'utf8')
    return { text, library: JSON.parse(text) }
  }
  const listCovers = () => fs.readdirSync(coversDir).filter((file) => !file.startsWith('.'))

  const writeLibrary = (library, previousText) => {
    const temporary = `${libraryFile}.tmp`
    fs.writeFileSync(temporary, serializeLibrary(library, previousText))
    fs.renameSync(temporary, libraryFile)
  }

  // A bad edit must never reach the disk, so check the result first
  function assertValid(library, coverFiles) {
    const { errors } = validateLibrary(library, { coverFiles })
    if (errors.length > 0) {
      throw new HttpError(422, `The library would be invalid: ${errors.slice(0, 3).join('; ')}`)
    }
  }

  const routes = {
    '/status': ({ releaseId, artistIds }) => {
      assertInput(typeof releaseId === 'string' && Array.isArray(artistIds))
      const { library } = readLibrary()
      return {
        exists: hasRelease(library, releaseId),
        missingArtists: findMissingArtists(library, artistIds),
      }
    },

    '/save': ({ release, artists, coverBase64 }) => {
      assertInput(
        typeof release?.coverUrl === 'string' &&
          typeof coverBase64 === 'string' &&
          Array.isArray(artists)
      )
      const cover = coverFileName(release.coverUrl)
      const image = Buffer.from(coverBase64, 'base64')
      if (!isWebp(image)) throw new HttpError(400, 'The cover is not a WebP image')

      const { text, library } = readLibrary()
      const { library: updated, replaced } = upsertRelease(library, {
        release: { ...release, cover },
        artists,
      })
      assertValid(updated, [...new Set([...listCovers(), cover])])

      fs.writeFileSync(path.join(coversDir, cover), image)
      writeLibrary(updated, text)

      console.log(`${replaced ? 'Updated' : 'Added'} "${release.title}"`)
      onChange?.()
      return { replaced }
    },

    '/remove': ({ releaseId }) => {
      assertInput(typeof releaseId === 'string')
      const { text, library } = readLibrary()
      const { library: updated, removed, coverToDelete } = removeRelease(library, releaseId)
      if (!removed) throw new HttpError(404, 'This release is not in the library')

      assertValid(
        updated,
        listCovers().filter((file) => file !== coverToDelete)
      )

      writeLibrary(updated, text)
      if (coverToDelete) fs.rmSync(path.join(coversDir, coverToDelete), { force: true })

      console.log(`Removed "${removed.title}"`)
      onChange?.()
      return {}
    },
  }

  return async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(body))
    }

    try {
      // Pages open in the browser must not be able to reach this, directly or via DNS rebinding
      const port = req.socket.localPort
      if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host ?? '')) {
        throw new HttpError(403, 'Unexpected host')
      }
      const origin = req.headers.origin
      if (origin !== undefined && !isExtensionOrigin(origin)) {
        throw new HttpError(403, 'Only the Krater extension may use this server')
      }
      // A custom header forces a CORS preflight from web pages, which this server never allows
      if (req.headers['x-krater'] !== '1') throw new HttpError(403, 'Missing X-Krater header')

      const handler = routes[req.url ?? '']
      if (!handler || req.method !== 'POST') throw new HttpError(404, 'Not found')

      send(200, { ok: true, ...handler((await readJson(req)) ?? {}) })
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500
      if (status === 500) console.error(error)
      send(status, { ok: false, error: error.message })
    }
  }
}

/**
 * Vite plugin that mounts the helper on the dev server. It does nothing in a production build.
 * @returns {import('vite').Plugin}
 */
export function kraterHelperPlugin() {
  return {
    name: 'krater-helper',
    apply: 'serve',
    configureServer(server) {
      const handler = createHelperHandler({
        root: server.config.root,
        // Vite does not watch the data file for pages, so tell open tabs to reload
        onChange: () => server.ws.send({ type: 'full-reload' }),
      })
      server.middlewares.use(HELPER_PATH, handler)
    },
  }
}
