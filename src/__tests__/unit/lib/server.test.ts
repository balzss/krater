import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import {
  deleteCoverFile,
  ensureDirectoryExists,
  getLibraryData,
  setLibraryData,
  getReleases,
  updateReleases,
  getArtists,
  updateArtists,
} from '@/lib/server'
import { mockLibraryData } from '../../mocks/data'

vi.mock('fs/promises')

describe('server utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('deleteCoverFile', () => {
    it('should delete file when filename provided', async () => {
      vi.mocked(fs.unlink).mockResolvedValue(undefined)

      await deleteCoverFile('test-cover.jpg')

      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('test-cover.jpg')
      )
    })

    it('should handle ENOENT error gracefully', async () => {
      const error: NodeJS.ErrnoException = new Error('File not found')
      error.code = 'ENOENT'
      vi.mocked(fs.unlink).mockRejectedValue(error)

      await expect(deleteCoverFile('missing.jpg')).resolves.toBeUndefined()
    })

    it('should do nothing when filename is null', async () => {
      await deleteCoverFile(null)
      expect(fs.unlink).not.toHaveBeenCalled()
    })

    it('should do nothing when filename is undefined', async () => {
      await deleteCoverFile(undefined)
      expect(fs.unlink).not.toHaveBeenCalled()
    })
  })

  describe('ensureDirectoryExists', () => {
    it('should create directory when it does not exist', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)

      await ensureDirectoryExists('/test/path')

      expect(fs.mkdir).toHaveBeenCalledWith('/test/path', { recursive: true })
    })

    it('should handle EEXIST error gracefully', async () => {
      const error: NodeJS.ErrnoException = new Error('Directory exists')
      error.code = 'EEXIST'
      vi.mocked(fs.mkdir).mockRejectedValue(error)

      await expect(ensureDirectoryExists('/test/path')).resolves.toBeUndefined()
    })

    it('should throw on other errors', async () => {
      const error: NodeJS.ErrnoException = new Error('Permission denied')
      error.code = 'EACCES'
      vi.mocked(fs.mkdir).mockRejectedValue(error)

      await expect(ensureDirectoryExists('/test/path')).rejects.toThrow(
        'Could not create directory'
      )
    })
  })

  describe('getLibraryData', () => {
    it('should read and parse library data', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockLibraryData))

      const result = await getLibraryData()

      expect(result).toEqual(mockLibraryData)
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('libraryData.json'),
        'utf8'
      )
    })

    it('should throw error when file cannot be read', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'))

      await expect(getLibraryData()).rejects.toThrow(
        'Could not read library data file'
      )
    })

    it('should throw error when JSON is invalid', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json{')

      await expect(getLibraryData()).rejects.toThrow()
    })
  })

  describe('setLibraryData', () => {
    it('should write library data to file', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)

      await setLibraryData(mockLibraryData)

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('libraryData.json'),
        JSON.stringify(mockLibraryData, null, 2),
        'utf-8'
      )
    })

    it('should throw error on write failure', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'))

      await expect(setLibraryData(mockLibraryData)).rejects.toThrow(
        'Failed to write data to JSON file'
      )
    })
  })

  describe('getReleases', () => {
    it('should return releases from library data', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockLibraryData))

      const result = await getReleases()

      expect(result).toEqual(mockLibraryData.releases)
    })

    it('should throw error when library data cannot be read', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Read error'))

      await expect(getReleases()).rejects.toThrow('Could not get releases data')
    })
  })

  describe('updateReleases', () => {
    it('should update releases while preserving artists', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockLibraryData))
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)

      const newReleases = [...mockLibraryData.releases]
      await updateReleases(newReleases)

      const writtenData = JSON.parse(
        vi.mocked(fs.writeFile).mock.calls[0][1] as string
      )
      expect(writtenData.releases).toEqual(newReleases)
      expect(writtenData.artists).toEqual(mockLibraryData.artists)
    })

    it('should throw error when library data cannot be read', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Read error'))

      await expect(updateReleases(mockLibraryData.releases)).rejects.toThrow(
        'Could not read releases data file'
      )
    })
  })

  describe('getArtists', () => {
    it('should return artists from library data', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockLibraryData))

      const result = await getArtists()

      expect(result).toEqual(mockLibraryData.artists)
    })

    it('should throw error when library data cannot be read', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Read error'))

      await expect(getArtists()).rejects.toThrow('Could not get artists data')
    })
  })

  describe('updateArtists', () => {
    it('should update artists while preserving releases', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockLibraryData))
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)

      const newArtists = [...mockLibraryData.artists]
      await updateArtists(newArtists)

      const writtenData = JSON.parse(
        vi.mocked(fs.writeFile).mock.calls[0][1] as string
      )
      expect(writtenData.artists).toEqual(newArtists)
      expect(writtenData.releases).toEqual(mockLibraryData.releases)
    })

    it('should throw error when library data cannot be read', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Read error'))

      await expect(updateArtists(mockLibraryData.artists)).rejects.toThrow(
        'Could not update artists'
      )
    })
  })
})
