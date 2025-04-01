'use client'

import { useEffect, useState } from 'react'
import { House, Dices } from 'lucide-react'
import { releases, artists, Release } from '@/lib/data'
import { MusicTile } from '@/components'

export default function RandomPage() {
  const [chosenRelease, setChosenRelease] = useState<Release | null>()
  const setRandomRelease = () => {
    const randomRelease = releases[Math.floor(Math.random() * releases.length)]
    setChosenRelease(randomRelease)
  }

  useEffect(() => {
    document.title = 'Random Release | Krater'
    setRandomRelease()
  }, [])

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16">
      <div className="flex items-center w-full max-w-sm gap-4 mb-4">
        <a
          href="/krater"
          className="h-8 w-8 flex justify-center items-center text-gray-300 hover:text-gray-400"
        >
          <House size={32} />
        </a>
      </div>
      <div className="w-full max-w-sm flex flex-col">
        {chosenRelease && (
          <MusicTile
            key={chosenRelease.rymId}
            cover={chosenRelease.cover}
            artists={chosenRelease.artistRymIds.map((id) =>
              artists.find((artist) => artist.rymId === id)
            )}
            title={chosenRelease.title}
            media={chosenRelease.media.spotify}
          />
        )}
        <div className="flex justify-center m-6">
          <button
            className="p-3 duration-300 transform transition hover:scale-105 cursor-pointer ease-in-out text-neutral-300 hover:text-neutral-200"
            onClick={setRandomRelease}
          >
            <Dices className="w-12 h-12" />
          </button>
        </div>
      </div>
    </div>
  )
}
