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
  ).replace(/^[\t ]*"[^:\n\r]+(?<!\\)":/gm, (match) => match.replace(/"/g, '')).slice(2, -2).concat(',')
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
  {
    displayName: 'Jan Jelinek',
    rymId: '[Artist11189]',
    rymUrl: 'https://rateyourmusic.com/artist/jan-jelinek',
  },
  {
    displayName: 'Jon Hopkins',
    rymId: '[Artist138451]',
    rymUrl: 'https://rateyourmusic.com/artist/jon-hopkins',
  },
  {
    displayName: 'Clark',
    rymId: '[Artist25176]',
    rymUrl: 'https://rateyourmusic.com/artist/clark_f1',
  },
  {
    displayName: 'Smokepurpp',
    rymId: '[Artist1224097]',
    rymUrl: 'https://rateyourmusic.com/artist/smokepurpp',
  },
  {
    displayName: 'Pop Smoke',
    rymId: '[Artist1399827]',
    rymUrl: 'https://rateyourmusic.com/artist/pop-smoke',
  },
  {
    displayName: 'Denzel Curry',
    rymId: '[Artist783766]',
    rymUrl: 'https://rateyourmusic.com/artist/denzel-curry',
  },
  {
    displayName: 'Intrusion',
    rymId: '[Artist337636]',
    rymUrl: 'https://rateyourmusic.com/artist/intrusion_f1',
  },
  {
    displayName: 'Deepchord Presents Echospace',
    rymId: '[Artist234382]',
    rymUrl: 'https://rateyourmusic.com/artist/deepchord-presents-echospace',
  },
  {
    displayName: 'Nala Sinephro',
    rymId: '[Artist1623299]',
    rymUrl: 'https://rateyourmusic.com/artist/nala-sinephro',
  },
  {
    displayName: 'Jessie Ware',
    rymId: '[Artist705952]',
    rymUrl: 'https://rateyourmusic.com/artist/jessie-ware',
  },
  {
    displayName: '杏里 [Anri]',
    rymId: '[Artist81437]',
    rymUrl: 'https://rateyourmusic.com/artist/%E6%9D%8F%E9%87%8C',
  },
  {
    displayName: '大貫妙子 [Taeko Ohnuki]',
    rymId: '[Artist158143]',
    rymUrl: 'https://rateyourmusic.com/artist/%E5%A4%A7%E8%B2%AB%E5%A6%99%E5%AD%90',
  },
  {
    displayName: 'William Onyeabor',
    rymId: '[Artist243860]',
    rymUrl: 'https://rateyourmusic.com/artist/william-onyeabor',
  },
  {
    displayName: 'Floating Points',
    rymId: '[Artist430173]',
    rymUrl: 'https://rateyourmusic.com/artist/floating-points',
  },
  {
    displayName: 'Luomo',
    rymId: '[Artist11863]',
    rymUrl: 'https://rateyourmusic.com/artist/luomo',
  },
  {
    displayName: 'Deadbeat',
    rymId: '[Artist31014]',
    rymUrl: 'https://rateyourmusic.com/artist/deadbeat',
  },
  {
    displayName: 'Yeat',
    rymId: '[Artist1480594]',
    rymUrl: 'https://rateyourmusic.com/artist/yeat',
  },
  {
    displayName: 'Warpaint',
    rymId: '[Artist329091]',
    rymUrl: 'https://rateyourmusic.com/artist/warpaint',
  },
  {
    displayName: 'The Microphones',
    rymId: '[Artist808]',
    rymUrl: 'https://rateyourmusic.com/artist/the-microphones',
  },
  {
    displayName: 'Oneohtrix Point Never',
    rymId: '[Artist351103]',
    rymUrl: 'https://rateyourmusic.com/artist/oneohtrix-point-never',
  },
  {
    displayName: 'Tim Hecker',
    rymId: '[Artist14863]',
    rymUrl: 'https://rateyourmusic.com/artist/tim-hecker',
  },
  {
    displayName: 'Los Mirlos',
    rymId: '[Artist252632]',
    rymUrl: 'https://rateyourmusic.com/artist/los-mirlos',
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
  {
    artistRymIds: ['[Artist11189]'],
    title: 'Loop-finding-jazz-records',
    rymId: '[Album39421]',
    cover: 'jan-jelinek-loop-finding-jazz-records-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/6UK4EMYa7by9xwU4eeAoE4',
    },
  },
  {
    artistRymIds: ['[Artist138451]'],
    title: 'Singularity',
    rymId: '[Album9045088]',
    cover: 'jon-hopkins-singularity-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/1nvzBC1M3dlCMIxfUCBhlO',
    },
  },
  {
    artistRymIds: ['[Artist25176]'],
    title: 'Body Riddle',
    rymId: '[Album625814]',
    cover: 'clark-body-riddle-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/04onGeB7bKwWHPPTXAiszV',
    },
  },
  {
    artistRymIds: ['[Artist1224097]'],
    title: 'Florida Jit',
    rymId: '[Album10995144]',
    cover: 'smokepurpp-florida-jit-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/3LAFsXbBJgFsh98uXIU2hB',
    },
  },
  {
    artistRymIds: ['[Artist1399827]'],
    title: 'Meet the Woo, Vol. 2',
    rymId: '[Album11100300]',
    cover: 'pop-smoke-meet-the-woo-vol-2-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/4MZnolldq7ciKKlbVDzLm5',
    },
  },
  {
    artistRymIds: ['[Artist783766]'],
    title: 'Zuu',
    rymId: '[Album10302259]',
    cover: 'denzel-curry-zuu-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/6PkSBdx19zarn4ae1D08gA',
    },
  },
  {
    artistRymIds: ['[Artist337636]'],
    title: 'The Seduction of Silence',
    rymId: '[Album2018066]',
    cover: 'intrusion-the-seduction-of-silence-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/0B5zNMsNTnaaXQVlfNA0Wd',
    },
  },
  {
    artistRymIds: ['[Artist234382]'],
    title: 'Liumin',
    rymId: '[Album2828068]',
    cover: 'deepchord-presents-echospace-liumin-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/2sBtwfqFvOdUkRxs741VBW',
    },
  },
  {
    artistRymIds: ['[Artist1623299]'],
    title: 'Endlessness',
    rymId: '[Album15958943]',
    cover: 'nala-sinephro-endlessness-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/51CQQ3tQLRZlZJZ5jcpoGE',
    },
  },
  {
    artistRymIds: ['[Artist705952]'],
    title: "What's Your Pleasure?",
    rymId: '[Album11181034]',
    cover: 'jessie-ware-whats-your-pleasure-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/1CTm3ARqDETSm7GfvNYNJp',
    },
  },
  {
    artistRymIds: ['[Artist81437]'],
    title: 'Timely!!',
    rymId: '[Album1835632]',
    cover: '%E6%9D%8F%E9%87%8C-anri-timely-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/3OvZYx7AAGplmJjwD29JiV',
    },
  },
  {
    artistRymIds: ['[Artist158143]'],
    title: 'Sunshower',
    rymId: '[Album1039463]',
    cover: '%E5%A4%A7%E8%B2%AB%E5%A6%99%E5%AD%90-taeko-ohnuki-sunshower-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/53YDN7b4vQ5MLMSPcnh9Os',
    },
  },
  {
    artistRymIds: ['[Artist243860]'],
    title: 'Who is William Onyeabor?',
    rymId: '[Album4695963]',
    cover: 'william-onyeabor-who-is-william-onyeabor-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/2OZuC75dcQ0wO5aWVRQCIR',
    },
  },
  {
    artistRymIds: ['[Artist430173]'],
    title: 'Crush',
    rymId: '[Album10596058]',
    cover: 'floating-points-crush-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/1WwZwdTICfaZI51BIIEN9z',
    },
  },
  {
    artistRymIds: ['[Artist11863]'],
    title: 'Vocalcity',
    rymId: '[Album42338]',
    cover: 'luomo-vocalcity-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/0SYQ4x4DsodUOdJcWYmM5V',
    },
  },
  {
    artistRymIds: ['[Artist31014]'],
    title: 'Drawn and Quartered',
    rymId: '[Album3411350]',
    cover: 'deadbeat-drawn-and-quartered-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/0Q3uXaz8utr9SpMUjq2JVO',
    },
  },
  {
    artistRymIds: ['[Artist1480594]'],
    title: '2093',
    rymId: '[Album15402489]',
    cover: 'yeat-2093-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/1jXYc5gip5tqCTDOotfY5L',
    },
  },
  {
    artistRymIds: ['[Artist329091]'],
    title: 'Exquisite Corpse',
    rymId: '[Album2052550]',
    cover: 'warpaint-exquisite-corpse-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/6oRX4P7faDMJAk0Of2uh5i',
    },
  },
  {
    artistRymIds: ['[Artist808]'],
    title: 'The Glow Pt. 2',
    rymId: '[Album2642]',
    cover: 'the-microphones-the-glow-pt-2-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/6QYoRO2sXThCORAifrP4Bl',
    },
  },
  {
    artistRymIds: ['[Artist351103]'],
    title: 'R Plus Seven',
    rymId: '[Album4612073]',
    cover: 'oneohtrix-point-never-r-plus-seven-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/68PRq4zj7YXMwiUq6FNGvR',
    },
  },
  {
    artistRymIds: ['[Artist14863]'],
    title: 'Ravedeath, 1972',
    rymId: '[Album3208874]',
    cover: 'tim-hecker-ravedeath-1972-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/6Iu8toVsvCc3I4INxYiVIy',
    },
  },
  {
    artistRymIds: ['[Artist252632]'],
    title: 'Cumbia amazónica',
    rymId: '[Album5332749]',
    cover: 'los-mirlos-cumbia-amazonica-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/3Almc0ajaT7YXLxpn18QBL',
    },
  },
]
