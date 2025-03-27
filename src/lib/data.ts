export type Artist = {
  rymId: string
  displayName: string
  rymUrl?: string
}

export type Release = {
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
  {
    displayName: 'DJ Shadow',
    rymId: '[Artist798]',
    rymUrl: 'https://rateyourmusic.com/artist/dj-shadow',
  },
  {
    displayName: 'Pusha T',
    rymId: '[Artist220496]',
    rymUrl: 'https://rateyourmusic.com/artist/pusha-t',
  },
  {
    displayName: 'JPEGMAFIA',
    rymId: '[Artist1114387]',
    rymUrl: 'https://rateyourmusic.com/artist/jpegmafia',
  },
  {
    displayName: 'Danny Brown',
    rymId: '[Artist395512]',
    rymUrl: 'https://rateyourmusic.com/artist/danny-brown',
  },
  {
    displayName: 'Lil Ugly Mane',
    rymId: '[Artist704404]',
    rymUrl: 'https://rateyourmusic.com/artist/lil-ugly-mane',
  },
  {
    displayName: 'Freddie Gibbs',
    rymId: '[Artist445025]',
    rymUrl: 'https://rateyourmusic.com/artist/freddie-gibbs',
  },
  {
    displayName: 'Rhythm & Sound',
    rymId: '[Artist11718]',
    rymUrl: 'https://rateyourmusic.com/artist/rhythm-and-sound',
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
  {
    artistRymIds: ['[Artist798]'],
    title: 'Endtroducing.....',
    rymId: '[Album2612]',
    cover: 'dj-shadow-endtroducing-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/4wvqGLk1HThPA0b5lzRK2l',
    },
  },
  {
    artistRymIds: ['[Artist220496]'],
    title: 'DAYTONA',
    rymId: '[Album9275699]',
    cover: 'pusha-t-daytona-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/07bIdDDe3I3hhWpxU6tuBp',
    },
  },
  {
    artistRymIds: ['[Artist1114387]', '[Artist395512]'],
    title: 'Scaring the Hoes',
    rymId: '[Album15165166]',
    cover: 'jpegmafia-and-danny-brown-scaring-the-hoes-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/3u20OXh03DjCUzbf8XcGTq',
    },
  },
  {
    artistRymIds: ['[Artist704404]'],
    title: 'Mista Thug Isolation',
    rymId: '[Album3805982]',
    cover: 'lil-ugly-mane-mista-thug-isolation-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/6VNXIYzXocTyZMNDLG88Gb',
    },
  },
  {
    artistRymIds: ['[Artist445025]', '[Artist45522]'],
    title: 'Alfredo',
    rymId: '[Album11560268]',
    cover: 'freddie-gibbs-and-the-alchemist-alfredo-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/3znl1qe13kyjQv7KcR685N',
    },
  },
  {
    artistRymIds: ['[Artist11718]'],
    title: 'See Mi Yah',
    rymId: '[Album283331]',
    cover: 'rhythm-and-sound-see-mi-yah-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/3pk6hhImeji8Eovq724Sun',
    },
  },
]
