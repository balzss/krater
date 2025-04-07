import path from 'path'
import fs from 'fs/promises'
import type { Release } from '@/lib/data'

const coversDir = path.join(process.cwd(), 'public', 'covers')
const releasesFilePath = path.join(process.cwd(), 'public', 'data', 'releases.json')

export async function deleteCoverFile(filename: string | undefined | null) {
  if (!filename) return // No filename, nothing to delete
  try {
    const filePath = path.join(coversDir, filename)
    await fs.unlink(filePath)
    console.log(`Deleted cover file: ${filePath}`)
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      // Only log errors other than "file not found"
      console.error(`Error deleting cover file ${filename}:`, error)
    }
  }
}

export async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      return // Directory already exists, which is fine.
    }
    console.error(`Error creating directory ${dirPath}:`, error)
    throw new Error(`Could not create directory: ${dirPath}`)
  }
}

export async function readReleasesFile(): Promise<Release[]> {
  try {
    const releasesJson = await fs.readFile(releasesFilePath, 'utf8')
    const releasesData = JSON.parse(releasesJson)
    return releasesData
  } catch (error: unknown) {
    console.error('Error reading releases file:', error)
    throw new Error('Could not read releases data file.')
  }
}

export async function writeReleasesToFile(releases: Release[]): Promise<void> {
  await fs.writeFile(releasesFilePath, JSON.stringify(releases, null, 2), 'utf-8')
}
