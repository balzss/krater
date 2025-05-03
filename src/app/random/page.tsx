'use client'

import { useEffect, useState } from 'react'
import { House, Dices, Undo2 } from 'lucide-react'
import { MusicTile, ActionButton } from '@/components'
import { useFetchJson } from '@/hooks'
import type { Artist, Release } from '@/lib/data'

export default function RandomPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const {
    data: releases,
    loading: releasesLoading,
    error: _releasesError,
  } = useFetchJson<Release[]>(`${basePath}/data/releases.json`, {
    sort: 'random',
    sortKey: 'title',
  })
  const {
    data: artists,
    loading: artistsLoading,
    error: _artistsError,
  } = useFetchJson<Artist[]>(`${basePath}/data/artists.json`)

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
        {!releasesLoading && releases && !artistsLoading && artists && (
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
              <ActionButton
                onClick={handleUndoButton}
                icon={Undo2}
                disabled={chosenReleaseIndex === 0}
                size={40}
              />
              <ActionButton onClick={handleRollButton} icon={Dices} size={40} />
              <ActionButton href="/" icon={House} size={40} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
