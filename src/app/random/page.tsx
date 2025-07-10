'use client'

import { useEffect, useState } from 'react'
import { House, Dices, Undo2, CircleAlert } from 'lucide-react'
import { MusicTile, ActionButton } from '@/components'
import { useLibraryData } from '@/hooks'

export default function RandomPage() {
  const { releases, artists, isLoading } = useLibraryData({ enabled: true })

  const [chosenReleaseIndex, setChosenReleaseIndex] = useState<number>(0)

  useEffect(() => {
    document.title = 'Random release | Krater'
  }, [])

  const handleUndoButton = () => {
    if (chosenReleaseIndex > 0) setChosenReleaseIndex((prevIndex) => prevIndex - 1)
  }

  const handleRollButton = () => {
    if (!releases?.length) return
    setChosenReleaseIndex((prevIndex) => (prevIndex + 1) % releases?.length)
  }

  if ((!artists?.length || !releases?.length) && !isLoading) {
    return (
      <div className="flex items-center justify-center m-4 sm:my-12 gap-2">
        <CircleAlert size={20} /> Your library is empty
      </div>
    )
  }

  if (isLoading || !artists?.length || !releases?.length) {
    return
  }

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16">
      <div className="w-full max-w-md flex flex-col gap-4">
        <div className="flex w-full gap-2 sm:gap-4 items-center">
          <h1 className="text-3xl font-bold mr-auto">Random release</h1>
          <ActionButton href="/" icon={House} />
        </div>

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
        <div className="flex justify-around">
          <ActionButton
            onClick={handleUndoButton}
            icon={Undo2}
            disabled={chosenReleaseIndex === 0}
            size={48}
          />
          <ActionButton onClick={handleRollButton} icon={Dices} size={48} />
        </div>
      </div>
    </div>
  )
}
