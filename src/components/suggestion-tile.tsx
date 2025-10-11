import { useState, useEffect, memo } from 'react'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { ActionButton } from '@/components'

interface SuggestionTileProps {
  name: string
  artist: string
  playcount: number
  url?: string
  image: string | null
  className?: string
}

const SuggestionTileComponent: React.FC<SuggestionTileProps> = ({
  name,
  artist,
  playcount,
  url,
  image,
  className = '',
}) => {
  const [showSearchBtn, setShowSearchBtn] = useState<boolean>(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  const handleRymSearch = () => {
    const searchTerm = encodeURIComponent(`${artist} ${name}`)
    const rymSearchUrl = `https://rateyourmusic.com/search?searchterm=${searchTerm}&searchtype=l`
    window.open(rymSearchUrl, '_blank')
  }

  return (
    <div
      data-testid="suggestion-tile"
      className={`bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md w-full transition duration-300 flex flex-col ${className}`}
      onMouseEnter={() => setShowSearchBtn(true)}
      onMouseLeave={() => setShowSearchBtn(false)}
    >
      <a
        className="flex relative w-full aspect-square cursor-pointer"
        href={url || '#'}
        target="_blank"
        rel="noopener noreferrer"
      >
        {image ? (
          <>
            <Image
              fill
              src={image}
              alt={name}
              className="transform transition hover:scale-101 ease-in-out duration-300"
            />
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold z-10">
              {playcount} plays
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </a>
      <div className="p-4 relative">
        <a
          className="font-bold text-gray-900 cursor-pointer hover:underline text-lg"
          href={url || '#'}
          target="_blank"
          rel="noopener noreferrer"
        >
          {name}
        </a>
        <p className="text-gray-600 text-sm pr-8">{artist}</p>
        <ActionButton
          onClick={handleRymSearch}
          icon={Search}
          className={`absolute bottom-2 right-2 text-gray-600 ${showSearchBtn || isTouchDevice ? 'opacity-100' : 'opacity-0'} transition duration-150 hover:bg-gray-100`}
          size={20}
          title="Search on RateYourMusic"
        />
      </div>
    </div>
  )
}

// Memoize to prevent unnecessary re-renders
const SuggestionTile = memo(SuggestionTileComponent)

export { SuggestionTile }
