// Pure helpers for editing libraryData.json. No browser or network APIs, so they can be unit tested.

export const LIBRARY_PATH = 'public/data/libraryData.json'
export const COVERS_DIR = 'public/covers'

const lastPathSegment = (url) => new URL(url).pathname.split('/').filter(Boolean).pop()

/** The artist key: the last path segment of an RYM artist URL */
export const slugFromUrl = lastPathSegment

/** Cover filename in the library: the RYM file name as .webp, Unicode-normalized */
export function coverFileName(coverUrl) {
  const name = decodeURIComponent(lastPathSegment(coverUrl)).replace(/\.[^.]+$/, '')
  return `${name.replace(/[/\\]/g, '-')}.webp`.normalize('NFC')
}

export function hasRelease(library, rymId) {
  return library.releases.some((release) => release.rymId === rymId)
}

export function findMissingArtists(library, artistIds) {
  const known = new Set(library.artists.map((artist) => artist.rymId))
  return artistIds.filter((id) => !known.has(id))
}

/**
 * Adds a release, or replaces the one with the same rymId. Artists the library doesn't know yet are
 * appended, existing artists are left alone.
 */
export function upsertRelease(library, { release, artists }) {
  const known = new Set(library.artists.map((artist) => artist.rymId))
  const newArtists = artists
    .filter((artist) => !known.has(artist.rymId))
    .map(({ displayName, rymId, rymUrl }) => ({ displayName, rymId, rymUrl }))

  const entry = {
    artistRymIds: artists.map((artist) => artist.rymId),
    title: release.title,
    rymId: release.rymId,
    cover: release.cover,
    media: release.media,
    rymUrl: release.rymUrl,
  }

  const replaced = hasRelease(library, release.rymId)
  const releases = replaced
    ? library.releases.map((existing) => (existing.rymId === release.rymId ? entry : existing))
    : [...library.releases, entry]

  return {
    library: { ...library, releases, artists: [...library.artists, ...newArtists] },
    replaced,
  }
}

/**
 * Removes a release along with the artists that only it used. The cover is reported for deletion
 * unless another release shares the file.
 */
export function removeRelease(library, rymId) {
  const removed = library.releases.find((release) => release.rymId === rymId)
  if (!removed) return { library, removed: null, coverToDelete: null }

  const releases = library.releases.filter((release) => release.rymId !== rymId)
  const stillUsed = new Set(releases.flatMap((release) => release.artistRymIds))
  const orphaned = new Set(removed.artistRymIds.filter((id) => !stillUsed.has(id)))
  const coverShared = releases.some((release) => release.cover === removed.cover)

  return {
    library: {
      ...library,
      releases,
      artists: library.artists.filter((artist) => !orphaned.has(artist.rymId)),
    },
    removed,
    coverToDelete: coverShared ? null : removed.cover,
  }
}

/** Serializes the way the file is stored, keeping whether it ended with a newline */
export function serializeLibrary(library, previousText = '') {
  return JSON.stringify(library, null, 2) + (previousText.endsWith('\n') ? '\n' : '')
}
