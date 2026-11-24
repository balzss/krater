#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Library Validation Script
 * Checks public/data/libraryData.json and public/covers for the problems that would break the site.
 * Exits with 1 when there are errors. Unused artists and covers are only warnings.
 */

const URL_FIELDS = ['spotify', 'appleMusic', 'bandcamp', 'youtube', 'soundcloud', 'tidal', 'deezer']

const slugFromUrl = (url) => new URL(url).pathname.split('/').filter(Boolean).pop()

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== ''

const isHttpUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

/**
 * @param {{ releases?: any[], artists?: any[] }} library
 * @param {{ coverFiles?: string[] }} [options] cover filenames found on disk, skip the cover checks when omitted
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateLibrary(library, { coverFiles } = {}) {
  const errors = []
  const warnings = []

  if (!library || !Array.isArray(library.releases) || !Array.isArray(library.artists)) {
    return { errors: ['Library must have "releases" and "artists" arrays'], warnings }
  }

  const artistIds = new Set()
  for (const artist of library.artists) {
    const label = `Artist ${artist?.rymId ?? '(no id)'}`

    if (!isNonEmptyString(artist?.rymId)) {
      errors.push(`${label}: rymId is required`)
      continue
    }
    if (artistIds.has(artist.rymId)) errors.push(`${label}: duplicate rymId`)
    artistIds.add(artist.rymId)

    if (!isNonEmptyString(artist.displayName)) errors.push(`${label}: displayName is required`)

    if (artist.rymUrl !== undefined) {
      if (!isHttpUrl(artist.rymUrl)) {
        errors.push(`${label}: rymUrl is not a valid URL`)
      } else if (slugFromUrl(artist.rymUrl) !== artist.rymId) {
        errors.push(
          `${label}: rymId must match the slug in rymUrl ("${slugFromUrl(artist.rymUrl)}")`
        )
      }
    }
  }

  const releaseIds = new Set()
  const usedArtistIds = new Set()
  const usedCovers = new Set()
  const coverSet = coverFiles ? new Set(coverFiles.map((file) => file.normalize('NFC'))) : null

  for (const release of library.releases) {
    const label = `Release ${release?.rymId ?? '(no id)'} (${release?.title ?? 'untitled'})`

    if (!isNonEmptyString(release?.rymId)) {
      errors.push(`${label}: rymId is required`)
      continue
    }
    if (releaseIds.has(release.rymId)) errors.push(`${label}: duplicate rymId`)
    releaseIds.add(release.rymId)

    if (!isNonEmptyString(release.title)) errors.push(`${label}: title is required`)

    if (!Array.isArray(release.artistRymIds) || release.artistRymIds.length === 0) {
      errors.push(`${label}: artistRymIds must be a non-empty array`)
    } else {
      for (const id of release.artistRymIds) {
        usedArtistIds.add(id)
        if (!artistIds.has(id)) errors.push(`${label}: unknown artist "${id}"`)
      }
    }

    if (!isNonEmptyString(release.cover)) {
      errors.push(`${label}: cover is required`)
    } else {
      usedCovers.add(release.cover.normalize('NFC'))
      if (coverSet && !coverSet.has(release.cover.normalize('NFC'))) {
        errors.push(`${label}: cover file "${release.cover}" not found`)
      }
    }

    if (typeof release.media !== 'object' || release.media === null) {
      errors.push(`${label}: media must be an object`)
    } else {
      for (const [service, url] of Object.entries(release.media)) {
        if (!URL_FIELDS.includes(service))
          errors.push(`${label}: unknown media service "${service}"`)
        else if (!isHttpUrl(url)) errors.push(`${label}: media.${service} is not a valid URL`)
      }
    }
  }

  for (const id of artistIds) {
    if (!usedArtistIds.has(id)) warnings.push(`Artist ${id} is not used by any release`)
  }
  if (coverSet) {
    for (const file of coverSet) {
      if (!usedCovers.has(file)) warnings.push(`Cover "${file}" is not used by any release`)
    }
  }

  return { errors, warnings }
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const libraryPath = path.join(root, 'public/data/libraryData.json')
  const coversDir = path.join(root, 'public/covers')

  const library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'))
  const coverFiles = fs.readdirSync(coversDir).filter((file) => !file.startsWith('.'))
  const { errors, warnings } = validateLibrary(library, { coverFiles })

  console.log(
    `${library.releases.length} releases, ${library.artists.length} artists, ${coverFiles.length} covers`
  )
  warnings.forEach((warning) => console.warn(`warning: ${warning}`))
  errors.forEach((error) => console.error(`error: ${error}`))

  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s)`)
    process.exit(1)
  }
  console.log('Library is valid.')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
