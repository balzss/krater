'use client'

import { useEffect, useState } from 'react'
import { House, Dices, Undo2 } from 'lucide-react'
import { artists, type Release } from '@/lib/data'
import { MusicTile } from '@/components'
import { useFetchJson } from '@/hooks'

export default function RandomPage() {
  const {
    data: releases,
    loading: releasesLoading,
    error: _releasesError,
  } = useFetchJson<Release[]>('/krater/data/releases.json', { randomize: true })
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

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16">
      <div className="w-full max-w-sm flex flex-col">
        {!releasesLoading && releases && (
          <>
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
              <button
                className="p-3 duration-150 transform transition cursor-pointer ease-in-out text-neutral-300 hover:text-neutral-200 disabled:cursor-not-allowed disabled:text-neutral-500"
                onClick={handleUndoButton}
                disabled={chosenReleaseIndex === 0}
              >
                <Undo2 size={48} />
              </button>
              <button
                className="p-3 duration-150 transform transition cursor-pointer ease-in-out text-neutral-300 hover:text-neutral-200"
                onClick={handleRollButton}
              >
                <Dices size={48} />
              </button>
              <a
                href="/krater"
                className="p-3 duration-150 transform transition cursor-pointer ease-in-out text-neutral-300 hover:text-neutral-200"
              >
                <House size={48} />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
