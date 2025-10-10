export type Media = {
  spotify?: string
  appleMusic?: string
  bandcamp?: string
  youtube?: string
  soundcloud?: string
  tidal?: string
  deezer?: string
}

export type Release = {
  artistRymIds: string[]
  title: string
  rymId: string
  rymUrl?: string
  cover: string
  media: Media
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
