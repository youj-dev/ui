import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The playlist plays on: the note hops twice to a beat beside the tracks. */
export const ListMusicIcon = createIcon({
  name: 'list-music',
  category: 'media',
  keywords: ['playlist', 'queue', 'tracks', 'songs', 'album', 'music list'],
  variants: (k) => ({
    note: {
      rest: { y: 0, rotate: 0, transition: k.tween('fast') },
      active: { y: [0, -1.5, 0, -1, 0], rotate: [0, -6, 0, -4, 0], transition: seq(k, 'deliberate', [0, 0.2, 0.45, 0.65, 1]) },
    },
  }),
  render: (v) => (
    <>
      <path d="M3.5 6 H15" />
      <path d="M3.5 11 H15" />
      <path d="M3.5 16 H10" />
      <m.g variants={v.note} style={origin(16.75, 18)}>
        <circle cx="16.75" cy="17.5" r="1.75" />
        <path d="M18.5 17.5 V8 L21 9" />
      </m.g>
    </>
  ),
})
