export type Release = {
  artistRymIds: string[]
  title: string
  rymId: string
  rymUrl?: string
  cover: string
  media: {
    spotify?: string
  }
}

export type Artist = {
  displayName: string
  rymId: string
  rymUrl?: string
}

export type LibraryData = {
  releases: Release[]
  artists: Artist[]
}
