import { Check, Sun, Moon, LayoutGrid, Grid3x3, Music2 } from 'lucide-react'
import { MenuItem, PageHeader } from '@/components'
import { useTheme, useLayout, useMediaPreference, usePageTitle } from '@/hooks'
import { MEDIA_PLAYERS, MediaPlayer } from '@/lib/constants'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { layout, toggleLayout } = useLayout()
  const { preferredPlayer, setPreference } = useMediaPreference()
  usePageTitle('Settings | Krater')

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16 gap-4">
      <div className="w-full max-w-lg flex flex-col gap-4">
        <PageHeader title="Settings" />

        <MenuItem
          aria-label="Toggle theme"
          startIcon={theme === 'dark' ? Sun : Moon}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        </MenuItem>

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
                className={`p-3 rounded-md border-2 transition-all text-left cursor-pointer ${
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
      </div>
    </div>
  )
}
