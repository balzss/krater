import { describe, it, expect } from 'vitest'
import { validateLibrary } from '../../../../scripts/validate-library.js'
import { createMockArtist, createMockRelease, mockLibraryData } from '../../mocks/data'

const library = (overrides: Record<string, unknown> = {}) => ({
  artists: [createMockArtist()],
  releases: [createMockRelease()],
  ...overrides,
})

describe('validateLibrary', () => {
  it('accepts a consistent library', () => {
    const { errors, warnings } = validateLibrary(mockLibraryData)
    expect(errors).toEqual([])
    expect(warnings).toEqual([])
  })

  it('rejects data without releases and artists arrays', () => {
    expect(validateLibrary({}).errors).toHaveLength(1)
    expect(validateLibrary(null as never).errors).toHaveLength(1)
  })

  it('reports a release that references an unknown artist', () => {
    const { errors } = validateLibrary(
      library({ releases: [createMockRelease({ artistRymIds: ['someone-else'] })] })
    )
    expect(errors).toContainEqual(expect.stringContaining('unknown artist "someone-else"'))
  })

  it('reports duplicate release and artist ids', () => {
    const { errors } = validateLibrary(
      library({
        artists: [createMockArtist(), createMockArtist()],
        releases: [createMockRelease(), createMockRelease()],
      })
    )
    expect(errors.filter((e) => e.includes('duplicate rymId'))).toHaveLength(2)
  })

  it('requires a non-empty artist list on every release', () => {
    const { errors } = validateLibrary(
      library({ releases: [createMockRelease({ artistRymIds: [] })] })
    )
    expect(errors).toContainEqual(expect.stringContaining('artistRymIds must be a non-empty array'))
  })

  it('requires the artist id to match the slug in its rymUrl', () => {
    const { errors } = validateLibrary(
      library({
        artists: [createMockArtist({ rymUrl: 'https://rateyourmusic.com/artist/other-name' })],
      })
    )
    expect(errors).toContainEqual(expect.stringContaining('must match the slug in rymUrl'))
  })

  it('accepts an artist id that matches its rymUrl slug', () => {
    const { errors } = validateLibrary(
      library({
        artists: [createMockArtist({ rymUrl: 'https://rateyourmusic.com/artist/test-artist' })],
      })
    )
    expect(errors).toEqual([])
  })

  it('rejects media links that are not http(s) URLs or not a known service', () => {
    const { errors } = validateLibrary(
      library({
        releases: [
          createMockRelease({
            media: { spotify: 'not a url', napster: 'https://x.test' } as never,
          }),
        ],
      })
    )
    expect(errors).toContainEqual(expect.stringContaining('media.spotify is not a valid URL'))
    expect(errors).toContainEqual(expect.stringContaining('unknown media service "napster"'))
  })

  describe('cover files', () => {
    it('reports a release whose cover file is missing', () => {
      const { errors } = validateLibrary(library(), { coverFiles: [] })
      expect(errors).toContainEqual(
        expect.stringContaining('cover file "test-cover.jpg" not found')
      )
    })

    it('warns about covers and artists nothing uses', () => {
      const { errors, warnings } = validateLibrary(
        library({
          artists: [createMockArtist(), createMockArtist({ rymId: 'idle', displayName: 'Idle' })],
        }),
        { coverFiles: ['test-cover.jpg', 'orphan.webp'] }
      )
      expect(errors).toEqual([])
      expect(warnings).toContainEqual(expect.stringContaining('Artist idle is not used'))
      expect(warnings).toContainEqual(expect.stringContaining('Cover "orphan.webp" is not used'))
    })

    it('matches cover names regardless of Unicode normalization', () => {
      const decomposed = 'café.webp'
      const composed = 'café.webp'
      const { errors } = validateLibrary(
        library({ releases: [createMockRelease({ cover: composed })] }),
        { coverFiles: [decomposed] }
      )
      expect(errors).toEqual([])
    })
  })
})
