'use client'

import { MouseEvent, useEffect, useRef } from 'react'
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
  KeyRound,
} from 'lucide-react'
import { MenuItem, ActionButton } from '@/components'
import { useTheme } from 'next-themes'
import { useLibraryData, useAuth, useHealthCheck } from '@/hooks'

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

export default function SettingsPage() {
  const importFileInputRef = useRef<HTMLInputElement>(null)
  const { theme, setTheme } = useTheme()
  const { getLibraryData, setLibraryData } = useLibraryData()
  const { isAdmin, login, logout, isLoading } = useAuth()
  const { healthData, refetchHealthData } = useHealthCheck()

  const { missingCovers, missingArtists, unusedCovers, unusedArtists } = healthData

  useEffect(() => {
    document.title = 'Settings | Krater'
  }, [])

  const handleDeleteCover = async (filename: string) => {
    if (!window.confirm(`Do you want to remove the cover file "${filename}"`)) return
    await fetch(`${apiRoot}/covers?filename=${filename}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    })
    await refetchHealthData()
  }

  const handleDeleteArtist = async (artistRymId: string, artistDisplayName: string) => {
    if (!window.confirm(`Do you want to remove artist "${artistDisplayName}"`)) return
    await fetch(`${apiRoot}/artists?rymId=${artistRymId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    })
    await refetchHealthData()
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
        <div className="flex w-full gap-2 sm:gap-4">
          <h1 className="text-4xl font-bold mr-auto">Settings</h1>
          <ActionButton href="/" icon={House} />
        </div>
        {theme && (
          <MenuItem startIcon={theme === 'dark' ? Sun : Moon} onClick={handleSwitchTheme}>
            Switch to {theme === 'dark' ? 'light' : 'dark'} theme
          </MenuItem>
        )}
        <MenuItem startIcon={Download} onClick={handleDownloadLibraryData}>
          Download data
        </MenuItem>
        {isAdmin ? (
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
            <MenuItem startIcon={LogOut} onClick={() => logout()}>
              Log out
            </MenuItem>
          </>
        ) : (
          <MenuItem
            startIcon={KeyRound}
            onClick={() => {
              const adminSecret = prompt('Please enter your admin key') || ''
              login(adminSecret)
            }}
          >
            Authenticate
          </MenuItem>
        )}
      </div>

      {isAdmin && (
        <div className="w-full max-w-lg p-4 border border-(--border) rounded-lg bg-(--card)">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Library health check</h2>
            <ActionButton
              icon={RefreshCcw}
              size={20}
              onClick={refetchHealthData}
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
              warningLabel={`${unusedCovers.length} unused cover${missingCovers.length > 1 ? 's were' : ' was'} detected`}
              warningItems={unusedCovers}
              onItemClick={(_e, i) => handleDeleteCover(unusedCovers[i])}
            />

            <CheckResult
              successLabel="No missing artists were detected"
              warningLabel={`${missingArtists.length} missing artist${missingArtists.length > 1 ? 's were ' : ' was '} detected`}
              warningItems={missingArtists.map(
                (missingArtist) =>
                  missingArtist.rymId + ' in release: ' + missingArtist.referencedIn
              )}
              onItemClick={(_e, i) => console.log(missingArtists[i])}
            />

            <CheckResult
              successLabel="No artists were detected without any release"
              warningLabel={`${unusedArtists.length} artist${unusedArtists.length > 1 ? 's were ' : ' was '} detected without any release`}
              warningItems={unusedArtists.map((artist) => artist.displayName)}
              onItemClick={(_e, i) =>
                handleDeleteArtist(unusedArtists[i].rymId, unusedArtists[i].displayName)
              }
            />
          </ul>
        </div>
      )}
    </div>
  )
}
