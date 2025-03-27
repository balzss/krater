type Artist = {
  rymId: string
  displayName: string
  rymUrl?: string
}

type Release = {
  artistRymIds: string[]
  title: string
  rymId?: string
  rymUrl?: string
  cover: string
  media: {
    spotify?: string
  }
}

export const artists: Artist[] = [
  {
    rymId: '[Artist661586]',
    displayName: 'Action Bronson',
    rymUrl: 'https://rateyourmusic.com/artist/action-bronson',
  },
  {
    rymId: '[Artist45522]',
    displayName: 'The Alchemist',
    rymUrl: 'https://rateyourmusic.com/artist/the-alchemist-2',
  },
  {
    rymId: '[Artist684375]',
    displayName: 'The Shaolin Afronauts',
    rymUrl: 'https://rateyourmusic.com/artist/the-shaolin-afronauts',
  },
  {
    rymId: '[Artist178378]',
    displayName: 'Studio',
    rymUrl: 'https://rateyourmusic.com/artist/studio',
  },
]

export const releases: Release[] = [
  {
    artistRymIds: ['[Artist661586]', '[Artist45522]'],
    title: 'Lamb Over Rice',
    rymId: '[Album10820731]',
    cover: 'action-bronson-and-the-alchemist-lamb-over-rice-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/3BPX4x5EQOd9vzpPC2rMrm',
    },
  },
  {
    artistRymIds: ['[Artist684375]'],
    title: 'Flight of the Ancients',
    rymId: '[Album3521194]',
    cover: 'the-shaolin-afronauts-flight-of-the-ancients-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/5XGRiFmZOsCy6ZqRFG5d6t',
    },
  },
  {
    artistRymIds: ['[Artist178378]'],
    title: 'West Coast',
    rymId: '[Album749205]',
    cover: 'studio-west-coast-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/545TSuBXtKERt6xHTpQDSA',
    },
  },
]
