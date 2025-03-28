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
  {
    artistRymIds: ['[Artist1149]'],
    title: 'The Richest Man in Babylon',
    rymId: '[Album31708]',
    cover: 'thievery-corporation-the-richest-man-in-babylon-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/7qJaVqhgiBtPLb9MOzwmZA',
    },
  },
  {
    artistRymIds: ['[Artist382649]'],
    title: 'The Groove Sessions',
    rymId: '[Album1959390]',
    cover: 'chinese-man-the-groove-sessions-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/6xe3lv1DBAh6Ef7BrBs0WE',
    },
  },
  {
    artistRymIds: ['[Artist946046]'],
    title: 'Viene de mi',
    rymId: '[Album4619728]',
    cover: 'la-yegros-viene-de-mi-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/0jhVG0QkajdwBeYndOq6aZ',
    },
  },
  {
    artistRymIds: ['[Artist783766]'],
    title: 'Melt My Eyez See Your Future',
    rymId: '[Album11866817]',
    cover: 'denzel-curry-melt-my-eyez-see-your-future-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/7KtyUeiJidoZO0ybxBXw0Q',
    },
  },
  {
    artistRymIds: ['[Artist1044543]'],
    title: 'None of This Is Real',
    rymId: '[Album6756333]',
    cover: 'dj-rozwell-none-of-this-is-real-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/1ALwbKFmLCyeirBWKC1Kb5',
    },
  },
  {
    artistRymIds: ['[Artist797]'],
    title: 'Since I Left You',
    rymId: '[Album2611]',
    cover: 'the-avalanches-since-i-left-you-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/3GBnNRYsxBfEeMSMmTpJ25',
    },
  },
  {
    artistRymIds: ['[Artist1289779]'],
    title: 'Kokoroko',
    rymId: '[Album9890588]',
    cover: 'kokoroko-kokoroko-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/1hb9IXQPS1uGLk5Ymv8Mmh',
    },
  },
  {
    artistRymIds: ['[Artist245125]'],
    title: 'Kottazűr',
    rymId: '[Album2843582]',
    cover: 'akkezdet-phiai-kottazur-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/68zvKSrfHgQSpsbb7wLU3G',
    },
  },
  {
    artistRymIds: ['[Artist952957]'],
    title: 'Garbage',
    rymId: '[Album5566863]',
    cover: 'bones-garbage-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/0GtIxp5YqAAWPK2Gtggu1y',
    },
  },
  {
    artistRymIds: ['[Artist952957]'],
    title: 'PaidProgramming2',
    rymId: '[Album7497049]',
    cover: 'bones-paidprogramming2-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/3sLfs0vKItAey8AzqYEWVX',
    },
  },
  {
    artistRymIds: ['[Artist1209864]'],
    title: '2012 - 2017',
    rymId: '[Album8998702]',
    cover: 'against-all-logic-2012-2017-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/1uzfGk9vxMXfaZ2avqwxod',
    },
  },
  {
    artistRymIds: ['[Artist830072]'],
    title: 'Nothing Is Still',
    rymId: '[Album9161941]',
    cover: 'leon-vynehall-nothing-is-still-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/6WeIO0CpDMiMXTglv0KuLr',
    },
  },
  {
    artistRymIds: ['[Artist395512]'],
    title: 'uknowhatimsayin¿',
    rymId: '[Album10236529]',
    cover: 'danny-brown-uknowhatimsayin-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/4G3BRVsGEpWzUdplFJ1VBl',
    },
  },
  {
    artistRymIds: ['[Artist693744]'],
    title: 'The Money Store',
    rymId: '[Album3892102]',
    cover: 'death-grips-the-money-store-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/1PQDjdBpHPikAodJqjzm6a',
    },
  },
  {
    artistRymIds: ['[Artist1137900]'],
    title: 'Die Lit',
    rymId: '[Album9243199]',
    cover: 'playboi-carti-die-lit-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/7dAm8ShwJLFm9SaJ6Yc58O',
    },
  },
  {
    artistRymIds: ['[Artist150975]'],
    title: 'From Here We Go Sublime',
    rymId: '[Album796730]',
    cover: 'the-field-from-here-we-go-sublime-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/77Kl8kGShA8a6Fb7nmrVYM',
    },
  },
  {
    artistRymIds: ['[Artist792]'],
    title: "Tomorrow's Harvest",
    rymId: '[Album4541338]',
    cover: 'boards-of-canada-tomorrows-harvest-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/159ORixBSSemxiualv1Woj',
    },
  },
  {
    artistRymIds: ['[Artist39950]'],
    title: 'Gloss Drop',
    rymId: '[Album3358218]',
    cover: 'battles-gloss-drop-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/1O58FiA79FsPVDezRyTlU3',
    },
  },
  {
    artistRymIds: ['[Artist39950]'],
    title: 'Mirrored',
    rymId: '[Album782491]',
    cover: 'battles-mirrored-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/0X8vBD8h1Ga9eLT8jx9VCC',
    },
  },
  {
    artistRymIds: ['[Artist147969]'],
    title: 'Antidotes',
    rymId: '[Album1207502]',
    cover: 'foals-antidotes-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/4FIDNlGVXZ4pCxdMjJXHoE',
    },
  },
  {
    artistRymIds: ['[Artist698]'],
    title: 'Lift Yr. Skinny Fists Like Antennas to Heaven!',
    rymId: '[Album2602]',
    cover: 'godspeed-you-black-emperor-lift-yr-skinny-fists-like-antennas-to-heaven-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/2rT82YYlV9UoxBYLIezkRq',
    },
  },
  {
    artistRymIds: ['[Artist68992]'],
    title: 'The English Riviera',
    rymId: '[Album3211100]',
    cover: 'metronomy-the-english-riviera-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/716fnrS2qXChPC3J2X73pK',
    },
  },
  {
    artistRymIds: ['[Artist488168]'],
    title: 'Engravings',
    rymId: '[Album4649599]',
    cover: 'forest-swords-engravings-Cover-Art.webp',
    media: {
      spotify: 'https://open.spotify.com/album/74UnLsuHAp1505hHzwcjPR',
    },
  },
]
