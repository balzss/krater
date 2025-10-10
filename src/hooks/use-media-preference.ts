'use client'

import { useState, useEffect } from 'react'
import { CONFIG, MEDIA_PLAYERS, MediaPlayer } from '@/lib/constants'

export function useMediaPreference() {
  const [preferredPlayer, setPreferredPlayer] = useState<MediaPlayer>(CONFIG.media.defaultPlayer)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('krater-preferred-media-player')
    if (stored && stored in MEDIA_PLAYERS) {
      setPreferredPlayer(stored as MediaPlayer)
    }
    setIsLoaded(true)
  }, [])

  const setPreference = (player: MediaPlayer) => {
    setPreferredPlayer(player)
    localStorage.setItem('krater-preferred-media-player', player)
  }

  return { preferredPlayer, setPreference, isLoaded }
}
