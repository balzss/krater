import { useState, Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Artist } from '@/lib/data'
import { BadgeInfo } from 'lucide-react'
import { ActionButton } from '@/components'

interface MusicTileProps {
  cover: string
  artists: (Artist | undefined)[]
  title: string
  media?: string
  priority?: boolean
  className?: string
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const MusicTile: React.FC<MusicTileProps> = ({
  cover,
  artists,
  title,
  media = '',
  priority = false,
  className = '',
}) => {
  const [showInfoBtn, setShowInfoBtn] = useState<boolean>(false)
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
  return (
    <div
      className={`bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md max-w-sm w-full transition duration-300 flex flex-col ${className}`}
      onMouseEnter={() => setShowInfoBtn(true)}
      onMouseLeave={() => setShowInfoBtn(false)}
    >
      <Link
        className="flex relative w-full aspect-square cursor-pointer"
        href={media}
        target="_blank"
        tabIndex={-1}
      >
        <Image
          fill
          src={`${basePath}/covers/${cover}`}
          alt={title}
          className="transform transition hover:scale-101 ease-in-out duration-300"
          priority={priority}
        />
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <Link
          className="text-lg font-bold text-gray-900 cursor-pointer hover:underline"
          href={media}
          target="_blank"
        >
          {title}
        </Link>
        <div className="flex h-full">
          <p className="text-sm text-gray-600 mr-auto">
            {artists.map((artist, index) => (
              <Fragment key={artist?.rymId || index}>
                {artist ? (
                  <Link className="hover:text-gray-500" href={`/browse?artist=${artist?.rymId}`}>
                    {artist?.displayName}
                  </Link>
                ) : (
                  <span>Unknown</span>
                )}
                {index < artists.length - 1 ? ', ' : ''}
              </Fragment>
            ))}
          </p>
          <ActionButton
            onClick={() => alert('Coming soon...')}
            icon={BadgeInfo}
            className={`text-gray-600 -mr-2 -mb-2 self-end ${showInfoBtn || isTouchDevice ? 'opacity-100' : 'opacity-0'} transition duration-150`}
            size={20}
          />
        </div>
      </div>
    </div>
  )
}

export { MusicTile }
