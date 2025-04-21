'use client'

import { useEffect, useState } from 'react'
import { Dices, Undo2 } from 'lucide-react'
import { MusicTile, ActionButton } from '@/components'
import { useFetchJson } from '@/hooks'
import type { Artist, Release } from '@/lib/data'

export default function CardPage() {
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
    document.title = 'Krater Card'
  }, [])

  const handleUndoButton = () => {
    if (chosenReleaseIndex > 0) setChosenReleaseIndex((prevIndex) => prevIndex - 1)
  }

  const handleRollButton = () => {
    if (!releases?.length) return
    setChosenReleaseIndex((prevIndex) => (prevIndex + 1) % releases?.length)
  }

  return (
    <div className="flex p-4 pr-0 h-screen">
      {!releasesLoading && releases && !artistsLoading && artists && (
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
          </div>
        </div>
      )}
    </div>
  )
}
