import { Fragment } from 'react'
import { type Artist } from '@/lib/artists'

interface MusicTileProps {
  cover: string
  artists: (Artist | undefined)[]
  title: string
  media?: string
}

const MusicTile: React.FC<MusicTileProps> = ({ cover, artists, title, media = '' }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl duration-300 max-w-sm w-full transform transition hover:scale-103 ease-in-out">
      <a
        className="flex relative w-full aspect-square cursor-pointer "
        href={media}
        target="_blank"
      >
        <img
          src={'/krater/covers/' + cover}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </a>
      <div className="p-4">
        <a className="text-lg font-bold text-gray-900 cursor-pointer" href={media} target="_blank">
          {title}
        </a>
        <p className="text-sm text-gray-600">
          {artists.map((artist, index) => (
            <Fragment key={artist?.rymId}>
              <a className="hover:text-gray-400" href={`/krater/browse?a=${artist?.rymId}`}>
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
