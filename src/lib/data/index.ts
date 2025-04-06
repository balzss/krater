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

export { releases, type Release } from './releases'
export { artists, type Artist } from './artists'
