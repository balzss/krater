import { describe, it, expect } from 'vitest'
import {
  slugFromUrl,
  coverFileName,
  hasRelease,
  findMissingArtists,
  upsertRelease,
  removeRelease,
  serializeLibrary,
} from '../../../../extension/lib/library.js'
import { validateLibrary } from '../../../../scripts/validate-library.js'
import type { Artist, Release } from '@/lib/data'
import { mockLibraryData } from '../../mocks/data'

const newArtist = {
  displayName: 'Freddie Gibbs',
  rymId: 'freddie-gibbs',
  rymUrl: 'https://rateyourmusic.com/artist/freddie-gibbs',
}
const newRelease = {
  title: 'Alfredo 2',
  rymId: '[Album16544979]',
  rymUrl: 'https://rateyourmusic.com/release/album/freddie-gibbs-the-alchemist/alfredo-2-1/',
  cover: 'freddie-gibbs-and-the-alchemist-alfredo-2-Cover-Art.webp',
  media: { spotify: 'https://open.spotify.com/album/5WrpCQmbTUZuzNxGCPUFSV' },
}

describe('slugFromUrl', () => {
  it('takes the last path segment', () => {
    expect(slugFromUrl('https://rateyourmusic.com/artist/the-alchemist-2')).toBe('the-alchemist-2')
  })

  it('ignores a trailing slash and the query string', () => {
    expect(slugFromUrl('https://rateyourmusic.com/artist/mick-jenkins/?x=1')).toBe('mick-jenkins')
  })
})

describe('coverFileName', () => {
  it('swaps the extension for .webp', () => {
    expect(
      coverFileName('https://cdn.sonemic.net/i/600/s/abc/11120533/mick-jenkins-the-patience-Cover-Art.png')
    ).toBe('mick-jenkins-the-patience-Cover-Art.webp')
  })

  it('keeps dots inside the name', () => {
    expect(coverFileName('https://cdn.sonemic.net/i/600/s/abc/1/dr.-dre-2001-Cover-Art.jpg')).toBe(
      'dr.-dre-2001-Cover-Art.webp'
    )
  })

  it('decodes percent-encoded names and normalizes Unicode', () => {
    const encoded = encodeURIComponent('杏里-anri-timely-Cover-Art') + '.jpg'
    expect(coverFileName(`https://cdn.sonemic.net/i/600/s/abc/1/${encoded}`)).toBe(
      '杏里-anri-timely-Cover-Art.webp'
    )
    expect(coverFileName('https://cdn.sonemic.net/1/cafe%CC%81.png')).toBe('café.webp')
  })

  it('never produces a path separator', () => {
    expect(coverFileName('https://cdn.sonemic.net/1/a%2Fb.png')).toBe('a-b.webp')
  })
})

describe('library lookups', () => {
  it('finds an existing release by rymId', () => {
    expect(hasRelease(mockLibraryData, 'ok-computer')).toBe(true)
    expect(hasRelease(mockLibraryData, 'nope')).toBe(false)
  })

  it('lists the artists the library does not know', () => {
    expect(findMissingArtists(mockLibraryData, ['radiohead', 'freddie-gibbs', 'the-alchemist-2'])).toEqual([
      'freddie-gibbs',
      'the-alchemist-2',
    ])
  })
})

describe('upsertRelease', () => {
  it('appends a new release and its new artists', () => {
    const { library, replaced } = upsertRelease(mockLibraryData, {
      release: newRelease,
      artists: [newArtist],
    })

    expect(replaced).toBe(false)
    expect(library.releases).toHaveLength(mockLibraryData.releases.length + 1)
    expect(library.releases.at(-1)).toEqual({ ...newRelease, artistRymIds: ['freddie-gibbs'] })
    expect(library.artists.at(-1)).toEqual(newArtist)
  })

  it('does not duplicate artists the library already has', () => {
    const { library } = upsertRelease(mockLibraryData, {
      release: { ...newRelease, rymId: 'another' },
      artists: [{ displayName: 'Radiohead (renamed)', rymId: 'radiohead' }],
    })

    expect(library.artists).toHaveLength(mockLibraryData.artists.length)
    expect(library.artists.find((a: Artist) => a.rymId === 'radiohead')?.displayName).toBe('Radiohead')
  })

  it('keeps the artist order of a joint release', () => {
    const { library } = upsertRelease(mockLibraryData, {
      release: newRelease,
      artists: [newArtist, { displayName: 'The Alchemist', rymId: 'the-alchemist-2' }],
    })

    expect(library.releases.at(-1)?.artistRymIds).toEqual(['freddie-gibbs', 'the-alchemist-2'])
  })

  it('replaces a release with the same rymId in place', () => {
    const { library, replaced } = upsertRelease(mockLibraryData, {
      release: { ...newRelease, rymId: 'ok-computer', title: 'OK Computer (remaster)' },
      artists: [{ displayName: 'Radiohead', rymId: 'radiohead' }],
    })

    expect(replaced).toBe(true)
    expect(library.releases).toHaveLength(mockLibraryData.releases.length)
    expect(library.releases[0].title).toBe('OK Computer (remaster)')
  })

  it('does not mutate its input', () => {
    const before = JSON.stringify(mockLibraryData)
    upsertRelease(mockLibraryData, { release: newRelease, artists: [newArtist] })
    expect(JSON.stringify(mockLibraryData)).toBe(before)
  })

  it('produces a library that passes validation', () => {
    const { library } = upsertRelease(mockLibraryData, { release: newRelease, artists: [newArtist] })
    const { errors } = validateLibrary(library, {
      coverFiles: [...mockLibraryData.releases.map((r) => r.cover), newRelease.cover],
    })
    expect(errors).toEqual([])
  })
})

describe('removeRelease', () => {
  it('removes the release, its cover, and artists nothing else uses', () => {
    const { library, removed, coverToDelete } = removeRelease(mockLibraryData, 'ok-computer')

    expect(removed?.title).toBe('OK Computer')
    expect(coverToDelete).toBe('ok-computer.jpg')
    expect(hasRelease(library, 'ok-computer')).toBe(false)
    expect(library.artists.map((a: Artist) => a.rymId)).not.toContain('radiohead')
  })

  it('keeps an artist that another release still uses', () => {
    const shared = upsertRelease(mockLibraryData, {
      release: { ...newRelease, rymId: 'kid-a', cover: 'kid-a.webp' },
      artists: [{ displayName: 'Radiohead', rymId: 'radiohead' }],
    }).library

    const { library } = removeRelease(shared, 'ok-computer')
    expect(library.artists.map((a: Artist) => a.rymId)).toContain('radiohead')
  })

  it('keeps a cover file another release shares', () => {
    const shared = upsertRelease(mockLibraryData, {
      release: { ...newRelease, rymId: 'twin', cover: 'ok-computer.jpg' },
      artists: [newArtist],
    }).library

    expect(removeRelease(shared, 'ok-computer').coverToDelete).toBeNull()
  })

  it('leaves the library alone when the release is unknown', () => {
    const result = removeRelease(mockLibraryData, 'nope')
    expect(result.removed).toBeNull()
    expect(result.library).toBe(mockLibraryData)
  })

  it('produces a library that passes validation', () => {
    const { library } = removeRelease(mockLibraryData, 'ok-computer')
    const { errors, warnings } = validateLibrary(library, {
      coverFiles: library.releases.map((r: Release) => r.cover),
    })
    expect(errors).toEqual([])
    expect(warnings).toEqual([])
  })
})

describe('serializeLibrary', () => {
  it('matches the stored formatting, with or without a trailing newline', () => {
    const json = JSON.stringify(mockLibraryData, null, 2)
    expect(serializeLibrary(mockLibraryData, json)).toBe(json)
    expect(serializeLibrary(mockLibraryData, json + '\n')).toBe(json + '\n')
  })
})
