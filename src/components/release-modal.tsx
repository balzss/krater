'use client'

import { FC, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import { X, ExternalLink, Trash2 } from 'lucide-react'
import type { Artist, Media } from '@/lib/data'
import { COVERS_PATH, MEDIA_PLAYERS } from '@/lib/constants'
import { getAvailableMediaPlayers } from '@/lib/media-utils'

interface ReleaseModalProps {
  isOpen: boolean
  onClose: () => void
  release: {
    title: string
    artistRymIds: string[]
    rymId: string
    rymUrl?: string
    cover: string
    media: Media
  }
  artists: (Artist | undefined)[]
  onRemove?: () => Promise<void>
  isAdmin?: boolean
}

export const ReleaseModal: FC<ReleaseModalProps> = ({
  isOpen,
  onClose,
  release,
  artists,
  onRemove,
  isAdmin = false,
}) => {
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const artistNames = artists.map((a) => a?.displayName || 'Unknown').join(', ')
  const availablePlayers = getAvailableMediaPlayers(release.media)

  const handleRemove = async () => {
    if (!onRemove || !isAdmin) return

    try {
      setIsRemoving(true)
      setError(null)
      await onRemove()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove release')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-(--card) p-6 shadow-lg overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <Dialog.Title className="text-2xl font-bold text-(--foreground) pr-8">
                {release.title}
              </Dialog.Title>
              <Dialog.Close className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            </div>

            <Dialog.Description className="text-base text-(--foreground) opacity-70">
              {artistNames}
            </Dialog.Description>

            {/* Cover Image */}
            <div className="relative w-full aspect-square max-w-[400px] mx-auto rounded-lg overflow-hidden shadow-md">
              <Image
                fill
                src={`${COVERS_PATH}/${release.cover}`}
                alt={release.title}
                className="object-cover"
              />
            </div>

            {/* Details Section */}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="font-semibold text-(--foreground) opacity-70">Artists:</dt>
              <dd className="text-(--foreground)">
                {artists.map((artist, index) => (
                  <span key={artist?.rymId || index}>
                    {artist ? (
                      <Link
                        href={`/browse?artist=${artist.rymId}`}
                        className="hover:underline text-blue-600 dark:text-blue-400"
                        onClick={onClose}
                      >
                        {artist.displayName}
                      </Link>
                    ) : (
                      'Unknown'
                    )}
                    {index < artists.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </dd>

              <dt className="font-semibold text-(--foreground) opacity-70">RYM ID:</dt>
              <dd className="text-(--foreground) font-mono text-xs">{release.rymId}</dd>

              {release.rymUrl && (
                <>
                  <dt className="font-semibold text-(--foreground) opacity-70">RYM Page:</dt>
                  <dd>
                    <a
                      href={release.rymUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      View on RateYourMusic
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </dd>
                </>
              )}

              {availablePlayers.length > 0 && (
                <>
                  <dt className="font-semibold text-(--foreground) opacity-70">Listen on:</dt>
                  <dd className="flex flex-wrap gap-2">
                    {availablePlayers.map((player) => (
                      <a
                        key={player}
                        href={release.media[player] || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 text-sm"
                      >
                        {MEDIA_PLAYERS[player].name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </dd>
                </>
              )}
            </dl>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 p-3 text-sm">
                {error}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-(--foreground) bg-(--card) border border-(--border) rounded-md hover:bg-(--item) focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Close
              </button>

              {isAdmin && onRemove && (
                <button
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {isRemoving ? 'Removing...' : 'Remove from Library'}
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
