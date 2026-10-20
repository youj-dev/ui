import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The note on the page bobs to a beat, tipping on its head and back. */
export const FileAudioIcon = createIcon({
  name: 'file-audio',
  category: 'files',
  keywords: ['audio file', 'music file', 'sound', 'mp3', 'song', 'track'],
  variants: (k) => ({
    note: {
      rest: { rotate: 0, y: 0, transition: k.tween('fast') },
      active: { rotate: [0, -12, 8, -4, 0], y: [0, -0.75, 0, -0.4, 0], transition: seq(k, 'deliberate', [0, 0.25, 0.5, 0.75, 1]) },
    },
  }),
  render: (v) => (
    <>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <m.g variants={v.note} style={origin(11.25, 16.5)}>
        <circle cx="11.25" cy="16.5" r="1.75" />
        <path d="M13 16.5 V11 L15.5 12" />
      </m.g>
    </>
  ),
})
