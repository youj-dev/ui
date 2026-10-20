import { m } from 'motion/react'
import { createIcon, origin, seq, type IconVariants } from './icon-base'

/* Arcs round the source dot, inner first: r9 and r16 quarter circles. */
const ARCS = ['M4 11 A9 9 0 0 1 13 20', 'M4 4 A16 16 0 0 1 20 20']

/** A new post goes out: the arcs go dark and light up again from the source outward, like wifi finding its signal. */
export const RssIcon = createIcon({
  name: 'rss',
  category: 'communication',
  keywords: ['rss', 'feed', 'subscribe', 'blog', 'news', 'updates', 'podcast', 'syndication'],
  variants: (k): IconVariants => ({
    source: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 1.5, 1], transition: seq(k, 'base', [0, 0.4, 1], ['exit', 'emphasized']) },
    },
    ...Object.fromEntries(
      ARCS.map((_, i) => [
        `a${i}`,
        {
          rest: { opacity: 1, transition: k.tween('fast') },
          active: {
            opacity: [null, 0.15, 0.15, 1],
            transition: seq(k, 'deliberate', [0, 0.15, 0.35 + i * 0.2, 0.55 + i * 0.2], ['exit', 'linear', 'enter']),
          },
        },
      ]),
    ),
  }),
  render: (v) => (
    <>
      <m.path d="M5 19 h.01" strokeWidth={2.25} variants={v.source} style={origin(5, 19)} />
      {ARCS.map((d, i) => (
        <m.path key={d} d={d} variants={v[`a${i}`]} />
      ))}
    </>
  ),
})
