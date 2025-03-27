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

/* dev console artist info -> copy to clipboard and paste it here
copy(
  JSON.stringify(
    [...document.querySelectorAll('.album_info a.artist')].map((artist) => ({
      displayName: artist.innerText,
      rymId: artist.title,
      rymUrl: artist.href,
    })),
    null,
    2
  ).replace(/^[\t ]*"[^:\n\r]+(?<!\\)":/gm, (match) => match.replace(/"/g, '')).slice(1, -2).concat(',')
)
 */

export const artists: Artist[] = [
  {
    displayName: 'Action Bronson',
    rymId: '[Artist661586]',
    rymUrl: 'https://rateyourmusic.com/artist/action-bronson',
  },
  {
    displayName: 'The Alchemist',
    rymId: '[Artist45522]',
    rymUrl: 'https://rateyourmusic.com/artist/the-alchemist-2',
  },
  {
    displayName: 'The Shaolin Afronauts',
    rymId: '[Artist684375]',
    rymUrl: 'https://rateyourmusic.com/artist/the-shaolin-afronauts',
  },
  {
    displayName: 'Studio',
    rymId: '[Artist178378]',
    rymUrl: 'https://rateyourmusic.com/artist/studio',
  },
  {
    displayName: 'Juaneco y Su Combo',
    rymId: '[Artist252287]',
    rymUrl: 'https://rateyourmusic.com/artist/juaneco_y_su_combo',
  },
]

/* dev console release info -> copy to clipboard and paste it here
copy(
  JSON.stringify(
    {
      artistRymIds: [...document.querySelectorAll('.album_info a.artist')].map((artist) => artist.title),
      title: document.querySelector('.album_title').innerText,
      rymId: document.querySelector('input.album_shortcut').value,
      cover: document.querySelector('.page_release_art_frame img').src.split('/').slice(-1)[0].split('.')[0] + '.webp',
      media: {
        spotify: document.querySelector('a.ui_media_link_btn_spotify').href,
      },
    },
    null,
    2
  ).replace(/^[\t ]*"[^:\n\r]+(?<!\\)":/gm, (match) => match.replace(/"/g, '')).concat(',')
)


[...document.querySelectorAll('.album_info a.artist')].map((artist) => artist.title)
 */
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
  {
    artistRymIds: ['[Artist252287]'],
    title: 'Leyenda amazónica',
    rymId: '[Album7288107]',
    cover: 'juaneco-y-su-combo-leyenda-amazonica-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/1XBTiJCFR4XFvymIUlnkKE',
    },
  },
]
