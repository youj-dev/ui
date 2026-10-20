import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The play mark on the page presses in and springs forward, like starting the clip. */
export const FileVideoIcon = createIcon({
  name: 'file-video',
  category: 'files',
  keywords: ['video file', 'movie', 'clip', 'mp4', 'film', 'media file'],
  variants: (k) => ({
    play: {
      rest: { x: 0, scale: 1, transition: k.tween('fast') },
      active: { x: [0, -0.5, 1, 0], scale: [1, 0.8, 1.05, 1], transition: seq(k, 'slow', [0, 0.3, 0.6, 1], ['exit', 'enter', 'standard']) },
    },
  }),
  render: (v) => (
    <>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <m.path d="M10.5 11.75 L14.5 14.5 L10.5 17.25 Z" variants={v.play} style={origin(12, 14.5)} />
    </>
  ),
})
