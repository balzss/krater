'use client'

import { useEffect, useState } from 'react'
import { Dices, Undo2, CircleAlert, LoaderCircle } from 'lucide-react'
import { MusicTile, ActionButton, SpotifyPlayButton } from '@/components'
import { useLibraryData } from '@/hooks'

export default function CardPage() {
  const { releases, artists, isLoading } = useLibraryData({ enabled: true })

  const [chosenReleaseIndex, setChosenReleaseIndex] = useState<number>(0)

  useEffect(() => {
    document.title = 'Krater Card'
  }, [])

  const handleUndoButton = () => {
    if (chosenReleaseIndex > 0) setChosenReleaseIndex((prevIndex) => prevIndex - 1)
  }

  const handleRollButton = () => {
    if (!releases?.length) return
    setChosenReleaseIndex((prevIndex) => (prevIndex + 1) % releases?.length)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center m-4 sm:my-12 gap-2">
        <LoaderCircle size={20} className="animate-spin" /> Fetching data...
      </div>
    )
  }

  if (!artists?.length || !releases?.length) {
    return (
      <div className="flex items-center justify-center m-4 sm:my-12 gap-2">
        <CircleAlert size={20} /> Your library is empty
      </div>
    )
  }

  return (
    <div className="flex p-4 pr-0 h-screen">
      <div className="max-h-screen h-full flex flex-grow justify-between">
        <MusicTile
          key={releases[chosenReleaseIndex].rymId}
          cover={releases[chosenReleaseIndex].cover}
          artists={releases[chosenReleaseIndex].artistRymIds.map((id) =>
            artists.find((artist) => artist.rymId === id)
          )}
          title={releases[chosenReleaseIndex].title}
          media={releases[chosenReleaseIndex].media.spotify}
          priority
          className="max-w-xs"
        />
        <div className="flex flex-col flex-grow items-center justify-around m-6">
          <ActionButton
            onClick={handleUndoButton}
            icon={Undo2}
            disabled={chosenReleaseIndex === 0}
            size={48}
          />
          <ActionButton onClick={handleRollButton} icon={Dices} size={48} />
          <SpotifyPlayButton albumUrl={releases[chosenReleaseIndex].media.spotify || ''} />
        </div>
      </div>
    </div>
  )
}
