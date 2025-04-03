import { Fragment } from 'react'
import Image from 'next/image'
import { type Artist } from '@/lib/artists'

interface MusicTileProps {
  cover: string
  artists: (Artist | undefined)[]
  title: string
  media?: string
  priority?: boolean
}

const MusicTile: React.FC<MusicTileProps> = ({
  cover,
  artists,
  title,
  media = '',
  priority = false,
}) => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl max-w-sm w-full">
      <a className="flex relative w-full aspect-square cursor-pointer" href={media} target="_blank">
        <Image
          fill
          src={'/krater/covers/' + cover}
          alt={title}
          className=" transform transition hover:scale-103 ease-in-out duration-300 "
          priority={priority}
        />
      </a>
      <div className="p-4">
        <a
          className="text-lg font-bold text-gray-900 cursor-pointer hover:underline"
          href={media}
          target="_blank"
        >
          {title}
        </a>
        <p className="text-sm text-gray-600">
          {artists.map((artist, index) => (
            <Fragment key={artist?.rymId}>
              <a className="hover:text-gray-500" href={`/krater/browse?a=${artist?.rymId}`}>
                {artist?.displayName}
              </a>
              {index < artists.length - 1 ? ', ' : ''}
            </Fragment>
          ))}
        </p>
      </div>
    </div>
  )
}

export { MusicTile }
