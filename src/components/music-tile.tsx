import { Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Artist } from '@/lib/data'

interface MusicTileProps {
  cover: string
  artists: (Artist | undefined)[]
  title: string
  media?: string
  priority?: boolean
  className?: string
}

const MusicTile: React.FC<MusicTileProps> = ({
  cover,
  artists,
  title,
  media = '',
  priority = false,
  className = '',
}) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  return (
    <div
      className={`bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg max-w-sm w-full transition duration-300 ${className}`}
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
          className=" transform transition hover:scale-103 ease-in-out duration-300 "
          priority={priority}
        />
      </Link>
      <div className="p-4">
        <Link
          className="text-lg font-bold text-gray-900 cursor-pointer hover:underline"
          href={media}
          target="_blank"
        >
          {title}
        </Link>
        <p className="text-sm text-gray-600">
          {artists.map((artist, index) => (
            <Fragment key={artist?.rymId || index}>
              {artist ? (
                <Link className="hover:text-gray-500" href={`/browse?a=${artist?.rymId}`}>
                  {artist?.displayName}
                </Link>
              ) : (
                <span>Unknown</span>
              )}
              {index < artists.length - 1 ? ', ' : ''}
            </Fragment>
          ))}
        </p>
      </div>
    </div>
  )
}

export { MusicTile }
