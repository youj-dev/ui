import { m } from 'motion/react'
import { createIcon, drawn, seqFor, type IconVariants } from './icon-base'

/** The headline box flashes and the columns under it are set again, line by line. */
export const NewspaperIcon = createIcon({
  name: 'newspaper',
  category: 'files',
  keywords: ['news', 'article', 'press', 'blog', 'feed', 'headlines', 'read'],
  variants: (k) => {
    const length = k.duration('deliberate') * 1.1
    const line = (i: number) => {
      const start = 0.2 + i * 0.25
      return {
        rest: drawn(k),
        active: {
          pathLength: [0, 0, 1, 1],
          opacity: [0, 0, 1, 1],
          transition: {
            pathLength: seqFor(k, length, [0, start, start + 0.4, 1], ['linear', 'standard', 'linear']),
            opacity: seqFor(k, length, [0, start, start + 0.01, 1], ['linear', 'linear', 'linear']),
          },
        },
      }
    }
    return {
      head: {
        rest: { opacity: 1, transition: k.tween('fast') },
        active: { opacity: [1, 0.25, 1], transition: seqFor(k, length * 0.5, [0, 0.4, 1], ['standard', 'standard']) },
      },
      l0: line(0),
      l1: line(1),
    } satisfies IconVariants
  },
  render: (v) => (
    <>
      <path d="M7.5 20 H18 A2 2 0 0 0 20 18 V6 A2 2 0 0 0 18 4 H9.5 A2 2 0 0 0 7.5 6 V18 A2 2 0 0 1 5.5 20 A2 2 0 0 1 3.5 18 V10 A1 1 0 0 1 4.5 9 H7.5" />
      <m.rect x="10.5" y="7" width="6.5" height="3.5" rx="0.75" variants={v.head} />
      <m.path d="M10.5 13.5 H17" variants={v.l0} />
      <m.path d="M10.5 16.5 H15" variants={v.l1} />
    </>
  ),
})
