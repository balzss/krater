'use client'

import { MouseEvent, useEffect, useRef, useState, FormEvent } from 'react'
import {
  Check,
  TriangleAlert,
  Sun,
  Moon,
  Download,
  FileUp,
  FilePenLine,
  RefreshCcw,
  CloudOff,
  LayoutGrid,
  Grid3x3,
  Music2,
  LogIn,
} from 'lucide-react'
import { MenuItem, PageHeader, ActionButton, JsonEditorModal } from '@/components'
import { useTheme } from 'next-themes'
import { useLibraryData, useAuth, useHealthCheck, useLayout, useMediaPreference } from '@/hooks'
import { MEDIA_PLAYERS, MediaPlayer } from '@/lib/constants'
import { SiLastdotfm } from '@icons-pack/react-simple-icons'
import { API_BASE_URL } from '@/lib/constants'
import { signIn } from '@/lib/auth-client'

const apiRoot = API_BASE_URL

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
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false)
  const [libraryData, setLibraryDataState] = useState<Awaited<
    ReturnType<typeof getLibraryData>
  > | null>(null)
  const [email, setEmail] = useState('admin@krater.local')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const { theme, setTheme } = useTheme()
  const { getLibraryData, setLibraryData } = useLibraryData()
  const { isAdmin, logout, isLoading } = useAuth()
  const { healthData, refetchHealthData } = useHealthCheck()
  const { layout, toggleLayout } = useLayout()
  const { preferredPlayer, setPreference } = useMediaPreference()

  const { missingCovers, missingArtists, unusedCovers, unusedArtists } = healthData

  useEffect(() => {
    document.title = 'Settings | Krater'
  }, [])

  useEffect(() => {
    // Load library data when editor opens
    if (isJsonEditorOpen && !libraryData) {
      getLibraryData().then(setLibraryDataState)
    }
  }, [isJsonEditorOpen, libraryData, getLibraryData])

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

  const handleSaveLibraryData = async (data: Awaited<ReturnType<typeof getLibraryData>>) => {
    try {
      const response = await fetch(`${apiRoot}/library-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save library data')
      }

      // Refresh the library data after successful save
      await refetchHealthData()
      alert('Library data saved successfully!')
    } catch (error) {
      console.error('Failed to save library data:', error)
      throw error
    }
  }

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)

    try {
      const { error: signInError } = await signIn.email({
        email,
        password,
      })

      if (signInError) {
        setLoginError(signInError.message || 'Failed to sign in')
      } else {
        // Force a full page reload to update auth state
        window.location.reload()
      }
    } catch (err) {
      setLoginError('An unexpected error occurred')
      console.error('Login error:', err)
    } finally {
      setIsLoggingIn(false)
    }
  }

  if (isLoading) {
    return
  }

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16 gap-4 sm:gap-6">
      <div className="flex flex-col items-center w-full max-w-lg gap-4 sm:gap-6">
        <PageHeader
          title="Settings"
          actions={
            theme && (
              <ActionButton
                onClick={handleSwitchTheme}
                icon={theme === 'dark' ? Sun : Moon}
                aria-label="Toggle theme"
              />
            )
          }
        />
        <MenuItem startIcon={Download} onClick={handleDownloadLibraryData}>
          Download library data
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
              Import from JSON
            </MenuItem>
            <MenuItem startIcon={FilePenLine} onClick={() => setIsJsonEditorOpen(true)}>
              Edit library
            </MenuItem>
            <MenuItem startIcon={CloudOff} onClick={() => logout()}>
              Logout
            </MenuItem>
          </>
        ) : (
          <div className="w-full p-4 border border-(--border) rounded-lg bg-(--card)">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <LogIn size={20} />
              Admin Login
            </h2>
            <p className="text-sm text-(--foreground) opacity-70 mb-4">
              Sign in to access library management features.
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              {loginError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded border border-rose-200 dark:border-rose-800 text-sm">
                  {loginError}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1 text-(--foreground)"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-(--border) rounded-md bg-(--background) text-(--foreground) focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isLoggingIn}
                  autoComplete="email"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-1 text-(--foreground)"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-(--border) rounded-md bg-(--background) text-(--foreground) focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isLoggingIn}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoggingIn ? 'Signing in...' : 'Sign In'}
              </button>

              <p className="text-xs text-(--foreground) opacity-60">
                Default credentials: admin@krater.local /{' '}
                {process.env.NODE_ENV === 'development' ? 'admin123' : '[set via env]'}
              </p>
            </form>
          </div>
        )}
        <MenuItem startIcon={layout === 'compact' ? LayoutGrid : Grid3x3} onClick={toggleLayout}>
          {layout === 'compact' ? 'Switch to standard view' : 'Switch to compact view'}
        </MenuItem>

        <div className="w-full p-4 border border-(--border) rounded-lg bg-(--card)">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Music2 size={20} />
            Media Player Preference
          </h2>
          <p className="text-sm text-(--foreground) opacity-70 mb-4">
            Choose your preferred music streaming service. When a release is available on multiple
            platforms, your preferred service will be used.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(MEDIA_PLAYERS) as MediaPlayer[]).map((player) => (
              <button
                key={player}
                onClick={() => setPreference(player)}
                className={`p-3 rounded-md border-2 transition-all text-left ${
                  preferredPlayer === player
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-(--border) bg-(--card) hover:bg-(--item)'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{MEDIA_PLAYERS[player].name}</span>
                  {preferredPlayer === player && <Check size={16} className="text-blue-500" />}
                </div>
              </button>
            ))}
          </div>

          <p className="text-xs text-(--foreground) opacity-60 mt-4">
            If your preferred service isn&apos;t available for a release, the next available option
            will be used automatically.
          </p>
        </div>

        {isAdmin && (
          <div className="w-full p-4 border border-(--border) rounded-lg bg-(--card)">
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

        <MenuItem
          startIcon={SiLastdotfm}
          onClick={() => {
            alert('Coming soon...')
          }}
        >
          Connect Last.fm
        </MenuItem>
      </div>

      {/* JSON Editor Modal */}
      {isAdmin && libraryData && (
        <JsonEditorModal
          isOpen={isJsonEditorOpen}
          onClose={() => setIsJsonEditorOpen(false)}
          initialData={libraryData}
          onSave={handleSaveLibraryData}
        />
      )}
    </div>
  )
}
