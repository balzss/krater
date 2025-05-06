'use client'

import { MouseEvent, useEffect, useState, useRef } from 'react'
import {
  House,
  Check,
  TriangleAlert,
  LoaderCircle,
  Sun,
  Moon,
  Download,
  FileUp,
  FilePenLine,
  RefreshCcw,
  LogOut,
  Key,
} from 'lucide-react'
import type { HealthIssues } from '@/app/api/health/route'
import { MenuItem, ActionButton } from '@/components'
import { useTheme } from 'next-themes'
import { useLibraryData } from '@/hooks'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const apiRoot = `${basePath}/api`

type CheckResultProps = {
  warningLabel: string
  successLabel: string
  warningItems: string[]
  onItemClick?: (e: MouseEvent<HTMLButtonElement>, itemIndex: number) => void
}

function CheckResult({ warningLabel, successLabel, warningItems, onItemClick }: CheckResultProps) {
  if (warningItems.length === 0) {
    return (
      <div className="max-w-lg w-full flex items-center gap-2">
        <Check size={20} /> {successLabel}
      </div>
    )
  }
  return (
    <div className="max-w-lg w-full">
      <span className="flex items-center gap-2">
        <TriangleAlert size={20} /> {warningLabel}
      </span>
      <ul className="ml-12">
        {warningItems.map((item, index) => (
          <li className="list-disc my-2 text-gray-400" key={item}>
            <button
              onClick={(e) => onItemClick?.(e, index)}
              className="hover:underline cursor-pointer block text-start"
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const isLocalhost = process.env.NEXT_PUBLIC_IS_LOCALHOST === 'true'

export default function SettingsPage() {
  const importFileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [missingCovers, setMissingCovers] = useState<HealthIssues['missingCovers']>([])
  const [missingArtistsData, setMissingArtistsData] = useState<HealthIssues['missingArtists']>([])
  const [unusedArtistsData, setUnusedArtistsData] = useState<HealthIssues['unusedArtists']>([])
  const [unusedCoversData, setUnusedCoversData] = useState<HealthIssues['unusedCovers']>([])

  const { theme, setTheme } = useTheme()
  const { getLibraryData, setLibraryData } = useLibraryData()

  const fetchHealtData = async () => {
    setIsLoading(true)
    const response = await fetch(`${apiRoot}/health`)
    const data = await response.json()
    setMissingCovers(data?.issues?.missingCovers || [])
    setMissingArtistsData(data?.issues?.missingArtists || [])
    setUnusedArtistsData(data?.issues?.unusedArtists || [])
    setUnusedCoversData(data?.issues?.unusedCovers || [])
    setIsLoading(false)
  }

  useEffect(() => {
    document.title = 'Settings | Krater'
    fetchHealtData()
  }, [])

  const handleDeleteCover = async (filename: string) => {
    if (!window.confirm(`Do you want to remove the cover file "${filename}"`)) return
    setIsLoading(true)
    await fetch(`${apiRoot}/covers?filename=${filename}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    })
    await fetchHealtData()
  }

  const handleDeleteArtist = async (artistRymId: string, artistDisplayName: string) => {
    if (!window.confirm(`Do you want to remove artist "${artistDisplayName}"`)) return
    setIsLoading(true)
    await fetch(`${apiRoot}/artists?rymId=${artistRymId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    })
    await fetchHealtData()
  }

  const handleSwitchTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleDownloadLibraryData = async () => {
    try {
      const libData = await getLibraryData()
      const jsonString = JSON.stringify(libData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const dateString = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
      link.download = `krater-library-${dateString}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      console.log('Data saved successfully as JSON.')
    } catch (error) {
      console.error('Failed to save data as JSON:', error)
    }
  }

  const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files

    if (!files || files.length === 0) {
      console.warn('No file selected.')
      event.target.value = ''
      return
    }

    await setLibraryData(files[0])

    event.target.value = ''
  }

  const handleImportClick = () => {
    importFileInputRef.current?.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center m-4 sm:my-12 gap-2">
        <LoaderCircle size={20} className="animate-spin" /> Fetching data...
      </div>
    )
  }

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16 gap-4 sm:gap-6">
      <div className="flex flex-col items-center w-full max-w-lg gap-4 sm:gap-6">
        <MenuItem startIcon={House} href="/">
          Return to home
        </MenuItem>
        {theme && (
          <MenuItem startIcon={theme === 'dark' ? Sun : Moon} onClick={handleSwitchTheme}>
            Switch to {theme === 'dark' ? 'light' : 'dark'} theme
          </MenuItem>
        )}
        <MenuItem startIcon={Download} onClick={handleDownloadLibraryData}>
          Download data
        </MenuItem>
        {isLocalhost ? (
          <>
            <input
              type="file"
              accept=".json,application/json"
              ref={importFileInputRef}
              onChange={handleImportFileChange}
              style={{ display: 'none' }}
            />
            <MenuItem startIcon={FileUp} onClick={handleImportClick}>
              Import JSON
            </MenuItem>
            <MenuItem startIcon={FilePenLine} onClick={() => alert('Coming soon...')}>
              Edit library
            </MenuItem>
            <MenuItem startIcon={LogOut} onClick={() => alert('Coming soon...')}>
              Log out
            </MenuItem>
          </>
        ) : (
          <MenuItem startIcon={Key} onClick={() => prompt('Please enter your admin key')}>
            Authenticate
          </MenuItem>
        )}
      </div>

      {isLocalhost && (
        <div className="w-full max-w-lg p-4 border border-(--border) rounded-lg bg-(--card)">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Library health check</h2>
            <ActionButton
              icon={RefreshCcw}
              size={20}
              onClick={fetchHealtData}
              className="-mt-1 -mr-1"
            />
          </div>
          <ul className="flex flex-col gap-4">
            <CheckResult
              successLabel="No missing covers were detected"
              warningLabel={`${missingCovers.length} missing cover${missingCovers.length > 1 ? 's were' : ' was'} detected`}
              warningItems={missingCovers.map(
                (cover) => `${cover.releaseArtists} - ${cover.releaseTitle} (${cover.filename})`
              )}
              onItemClick={(_e, i) => console.log(missingCovers[i])}
            />

            <CheckResult
              successLabel="No unused covers were detected"
              warningLabel={`${unusedCoversData.length} unused cover${missingCovers.length > 1 ? 's were' : ' was'} detected`}
              warningItems={unusedCoversData}
              onItemClick={(_e, i) => handleDeleteCover(unusedCoversData[i])}
            />

            <CheckResult
              successLabel="No missing artists were detected"
              warningLabel={`${missingArtistsData.length} missing artist${missingArtistsData.length > 1 ? 's were ' : ' was '} detected`}
              warningItems={missingArtistsData.map(
                (missingArtist) =>
                  missingArtist.rymId + ' in release: ' + missingArtist.referencedIn
              )}
              onItemClick={(_e, i) => console.log(missingArtistsData[i])}
            />

            <CheckResult
              successLabel="No artists were detected without any release"
              warningLabel={`${unusedArtistsData.length} artist${unusedArtistsData.length > 1 ? 's were ' : ' was '} detected without any release`}
              warningItems={unusedArtistsData.map((artist) => artist.displayName)}
              onItemClick={(_e, i) =>
                handleDeleteArtist(unusedArtistsData[i].rymId, unusedArtistsData[i].displayName)
              }
            />
          </ul>
        </div>
      )}
    </div>
  )
}
