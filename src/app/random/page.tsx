'use client'

import { useEffect, useState } from 'react'
import { House, Dices, Undo2, LoaderCircle, CircleAlert } from 'lucide-react'
import { MusicTile, ActionButton } from '@/components'
import { useLibraryData } from '@/hooks'

export default function RandomPage() {
  const { releases, artists, isLoading } = useLibraryData({ enabled: true })

  const [chosenReleaseIndex, setChosenReleaseIndex] = useState<number>(0)

  useEffect(() => {
    document.title = 'Random Release | Krater'
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
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16">
      <div className="w-full max-w-sm flex flex-col">
        <MusicTile
          key={releases[chosenReleaseIndex].rymId}
          cover={releases[chosenReleaseIndex].cover}
          artists={releases[chosenReleaseIndex].artistRymIds.map((id) =>
            artists.find((artist) => artist.rymId === id)
          )}
          title={releases[chosenReleaseIndex].title}
          media={releases[chosenReleaseIndex].media.spotify}
          priority
        />
        <div className="flex justify-between m-6">
          <ActionButton
            onClick={handleUndoButton}
            icon={Undo2}
            disabled={chosenReleaseIndex === 0}
            size={40}
          />
          <ActionButton onClick={handleRollButton} icon={Dices} size={40} />
          <ActionButton href="/" icon={House} size={40} />
        </div>
      </div>
    </div>
  )
}
