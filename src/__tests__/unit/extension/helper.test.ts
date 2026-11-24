import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  callHelper,
  isLocalHelperUrl,
  HelperError,
  DEFAULT_HELPER_URL,
} from '../../../../extension/lib/helper.js'

afterEach(() => vi.unstubAllGlobals())

describe('isLocalHelperUrl', () => {
  it.each([DEFAULT_HELPER_URL, 'http://127.0.0.1', 'http://localhost:5173', 'http://localhost'])(
    'accepts %s',
    (url) => expect(isLocalHelperUrl(url)).toBe(true)
  )

  it.each([
    'https://127.0.0.1:5173',
    'http://example.com:5173',
    'http://127.0.0.1.evil.com',
    'http://localhost@evil.com',
    'http://127.0.0.1:5173/path',
    'ftp://localhost',
    '',
  ])('rejects %s', (url) => expect(isLocalHelperUrl(url)).toBe(false))
})

describe('callHelper', () => {
  it('posts JSON with the X-Krater header and returns the answer', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, exists: false })))
    vi.stubGlobal('fetch', fetchMock)

    expect(await callHelper('http://127.0.0.1:5173', '/status', { releaseId: 'x' })).toEqual({
      ok: true,
      exists: false,
    })
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:5173/__krater/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Krater': '1' },
      body: '{"releaseId":"x"}',
    })
  })

  it('reports an unreachable dev server with the command that starts it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = await callHelper('http://127.0.0.1:5173', '/status', {}).catch((e) => e)

    expect(error).toBeInstanceOf(HelperError)
    expect(error.unreachable).toBe(true)
    expect(error.message).toContain('npm run dev')
  })

  it('says the browser blocked the extension when the server answers a plain request', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch')) // the CORS-checked POST
      .mockResolvedValueOnce(new Response(null)) // the no-cors probe
    vi.stubGlobal('fetch', fetchMock)

    const error = await callHelper('http://127.0.0.1:5173', '/status', {}).catch((e) => e)

    expect(error).toBeInstanceOf(HelperError)
    expect(error.blocked).toBe(true)
    expect(error.unreachable).toBe(false)
    expect(error.message).toContain('site access')
    expect(fetchMock).toHaveBeenLastCalledWith('http://127.0.0.1:5173', { mode: 'no-cors' })
  })

  it("passes on the helper's error message", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: false, error: 'Nope' }), { status: 422 }))
    )

    const error = await callHelper('http://127.0.0.1:5173', '/save', {}).catch((e) => e)

    expect(error.message).toBe('Nope')
    expect(error.unreachable).toBe(false)
    expect(error.blocked).toBe(false)
  })

  it('copes with an answer that is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>', { status: 502 })))

    await expect(callHelper('http://127.0.0.1:5173', '/status', {})).rejects.toThrow(
      'Krater answered 502'
    )
  })
})
