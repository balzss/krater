interface MusicTileProps {
  cover: string
  artists: string[]
  title: string
  media?: string
}

const MusicTile: React.FC<MusicTileProps> = ({ cover, artists, title, media = '' }) => {
  return (
    <a
      className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl duration-300 max-w-sm w-full transform transition hover:scale-103 cursor-pointer ease-in-out"
      href={media}
      target="_blank"
    >
      <div className="relative w-full aspect-square">
        <img
          src={'/krater/covers/' + cover}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{artists.join(', ')}</p>
      </div>
    </a>
  )
}

export { MusicTile }
