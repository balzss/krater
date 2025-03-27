interface MusicTileProps {
  cover: string
  artists: string[]
  title: string
  media?: string
}

const MusicTile: React.FC<MusicTileProps> = ({ cover, artists, title, media = '' }) => {
  return (
    <a
      className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl duration-300 max-w-sm w-full h-auto transform transition hover:scale-103 cursor-pointer ease-in-out"
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

export { MusicTile }
