import { useState, useEffect, Fragment, useMemo, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Artist, Media } from '@/lib/data'
import { BadgeInfo } from 'lucide-react'
import { ActionButton, ReleaseModal } from '@/components'
import { COVERS_PATH } from '@/lib/constants'
import { useRemoveRelease, useMediaPreference } from '@/hooks'
import { getPreferredMediaUrl } from '@/lib/media-utils'

interface MusicTileProps {
  cover: string
  artists: (Artist | undefined)[]
  title: string
  rymId: string
  rymUrl?: string
  media: Media
  priority?: boolean
  className?: string
  compact?: boolean
}

const MusicTileComponent: React.FC<MusicTileProps> = ({
  cover,
  artists,
  title,
  rymId,
  rymUrl,
  media,
  priority = false,
  className = '',
  compact = false,
}) => {
  const [showInfoBtn, setShowInfoBtn] = useState<boolean>(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { removeRelease, isAdmin } = useRemoveRelease()
  const { preferredPlayer, isLoaded } = useMediaPreference()

  const mediaUrl = useMemo(
    () => (isLoaded ? getPreferredMediaUrl(media, preferredPlayer) : media.spotify || ''),
    [media, preferredPlayer, isLoaded]
  )

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  const handleRemove = async () => {
    await removeRelease(rymId)
  }

  return (
    <div
      data-testid="music-tile"
      className={`bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md w-full transition duration-300 flex flex-col ${compact ? 'text-xs' : ''} ${className}`}
      onMouseEnter={() => setShowInfoBtn(true)}
      onMouseLeave={() => setShowInfoBtn(false)}
    >
      <Link
        className="flex relative w-full aspect-square cursor-pointer"
        href={mediaUrl || '#'}
        target="_blank"
        tabIndex={-1}
      >
        <Image
          fill
          src={`${COVERS_PATH}/${cover}`}
          alt={title}
          className="transform transition hover:scale-101 ease-in-out duration-300"
          priority={priority}
        />
      </Link>
      <div className={`${compact ? 'p-2' : 'p-4'} relative`}>
        <Link
          className={`font-bold text-gray-900 cursor-pointer hover:underline ${compact ? 'text-sm' : 'text-lg'}`}
          href={mediaUrl || '#'}
          target="_blank"
        >
          {title}
        </Link>
        <p className={`text-gray-600 ${compact ? 'text-xs pr-6' : 'text-sm pr-8'}`}>
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
          onClick={() => setIsModalOpen(true)}
          icon={BadgeInfo}
          className={`absolute ${compact ? 'bottom-1 right-1' : 'bottom-2 right-2'} text-gray-600 ${showInfoBtn || isTouchDevice ? 'opacity-100' : 'opacity-0'} transition duration-150 hover:bg-gray-100`}
          size={compact ? 16 : 20}
        />
      </div>

      <ReleaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        release={{
          title,
          artistRymIds: artists.map((a) => a?.rymId || ''),
          rymId,
          rymUrl,
          cover,
          media,
        }}
        artists={artists}
        onRemove={handleRemove}
        isAdmin={isAdmin}
      />
    </div>
  )
}

// Memoize to prevent unnecessary re-renders when parent re-renders
const MusicTile = memo(MusicTileComponent)

export { MusicTile }
