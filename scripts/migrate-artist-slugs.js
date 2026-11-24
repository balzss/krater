#!/usr/bin/env node

import fs from 'fs'
import { execSync } from 'child_process'

/**
 * Artist ID Migration Script
 * Replaces "[ArtistNNN]" artist IDs in libraryData.json with the slug from each artist's rymUrl.
 * Runs as a dry run unless --write is passed. Writing requires a clean git state for the file,
 * so git history is the backup.
 */

const args = process.argv.slice(2)
const write = args.includes('--write')
const file = args.find((arg) => !arg.startsWith('--')) || 'public/data/libraryData.json'

const slugFromUrl = (url) => new URL(url).pathname.split('/').filter(Boolean).pop()

const raw = fs.readFileSync(file, 'utf8')
const data = JSON.parse(raw)
const { artists, releases } = data

const problems = []
const idToSlug = new Map()

for (const artist of artists) {
  if (!artist.rymUrl) {
    problems.push(`Artist ${artist.rymId} (${artist.displayName}) has no rymUrl`)
    continue
  }
  idToSlug.set(artist.rymId, slugFromUrl(artist.rymUrl))
}

const slugOwners = new Map()
for (const [id, slug] of idToSlug) {
  if (slugOwners.has(slug)) {
    problems.push(`Slug "${slug}" is used by both ${slugOwners.get(slug)} and ${id}`)
  }
  slugOwners.set(slug, id)
}

for (const release of releases) {
  for (const id of release.artistRymIds) {
    if (!idToSlug.has(id)) {
      problems.push(`Release ${release.rymId} (${release.title}) references unknown artist ${id}`)
    }
  }
}

const needsMigration = artists.some((artist) => artist.rymId.startsWith('[Artist'))

console.log(`${file}: ${artists.length} artists, ${releases.length} releases`)

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s), nothing changed:`)
  problems.forEach((problem) => console.error(`  - ${problem}`))
  process.exit(1)
}

if (!needsMigration) {
  console.log('No [Artist…] IDs found, nothing to migrate.')
  process.exit(0)
}

console.log('\nSample mappings:')
for (const [id, slug] of [...idToSlug].slice(0, 5)) {
  console.log(`  ${id} -> ${slug}`)
}

if (!write) {
  console.log('\nDry run, no changes written. Re-run with --write to apply.')
  process.exit(0)
}

try {
  execSync(`git diff --quiet -- "${file}"`)
} catch {
  console.error(`\n${file} has uncommitted changes. Commit or stash them first.`)
  process.exit(1)
}

for (const artist of artists) {
  artist.rymId = idToSlug.get(artist.rymId)
}
for (const release of releases) {
  release.artistRymIds = release.artistRymIds.map((id) => idToSlug.get(id))
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + (raw.endsWith('\n') ? '\n' : ''))
console.log(`\nMigrated ${artists.length} artists and ${releases.length} releases.`)
