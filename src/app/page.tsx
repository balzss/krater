import { releases, artists } from '@/lib/data'

interface MusicTileProps {
  cover: string
  artists: string[]
  title: string
  media?: string
}

const MusicTile: React.FC<MusicTileProps> = ({ cover, artists, title, media = '' }) => {
  return (
    <a
      className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl duration-300 max-w-sm w-full h-auto transform transition hover:scale-103 cursor-pointer ease-in-out"
      href={media}
      target="_blank"
    >
      <img
        src={'/krater/covers/' + cover}
        alt={title}
        className="w-full max-h-sm h-auto object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{artists.join(', ')}</p>
      </div>
    </a>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8 w-full p-4 sm:p-16 justify-items-center">
        {releases.map(({ artistRymIds, title, rymId, cover, media }) => (
          <MusicTile
            key={rymId}
            cover={cover}
            artists={artistRymIds.map(
              (id) => artists.find((artist) => artist.rymId === id)?.displayName as string
            )}
            title={title}
            media={media.spotify}
          />
        ))}
      </div>
    </div>
  )
}
