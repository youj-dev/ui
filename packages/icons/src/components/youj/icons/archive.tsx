import { m } from 'motion/react'
import { createIcon, origin, seqFor } from './icon-base'

/** Filing away: the lid lifts, an item drops into the box, and the lid shuts on it with a thud. */
export const ArchiveIcon = createIcon({
  name: 'archive',
  category: 'files',
  keywords: ['box', 'store', 'file away', 'backup', 'storage', 'package'],
  variants: (k) => {
    const length = k.duration('deliberate') * 1.3
    return {
      lid: {
        rest: { y: 0, transition: k.tween('fast') },
        active: { y: [0, -3, -3, 0, 0], transition: seqFor(k, length, [0, 0.22, 0.58, 0.74, 1], ['enter', 'linear', 'exit', 'linear']) },
      },
      item: {
        rest: { y: 0, opacity: 0, transition: k.tween('fast') },
        active: {
          y: [0, 0, 4.5, 4.5],
          opacity: [0, 0, 1, 1, 0, 0],
          transition: {
            y: seqFor(k, length, [0, 0.24, 0.54, 1], ['linear', 'exit', 'linear']),
            opacity: seqFor(k, length, [0, 0.14, 0.2, 0.48, 0.58, 1], ['linear', 'linear', 'linear', 'linear', 'linear']),
          },
        },
      },
      box: {
        rest: { y: 0, transition: k.tween('fast') },
        active: { y: [0, 0, 0.75, 0], transition: seqFor(k, length, [0, 0.72, 0.8, 1], ['linear', 'exit', 'emphasized']) },
      },
    }
  },
  render: (v) => (
    <>
      <m.path d="M9.5 7 H14.5" variants={v.item} />
      <m.g variants={v.box} style={origin(12, 20.5)}>
        <path d="M5 8.5 V18.5 A2 2 0 0 0 7 20.5 H17 A2 2 0 0 0 19 18.5 V8.5" />
        <path d="M10 12.5 H14" />
      </m.g>
      <m.g variants={v.lid}>
        <rect x="3" y="3.5" width="18" height="5" rx="2" />
      </m.g>
    </>
  ),
})
