import { m } from 'motion/react'
import { createIcon, drawIn, hidden, origin, seq } from './icon-base'

/** The lens breathes once and a glint sweeps across the glass. */
export const SearchIcon = createIcon({
  name: 'search',
  category: 'navigation',
  keywords: ['find', 'magnifier', 'lookup', 'query', 'zoom'],
  variants: (k) => ({
    lens: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 1.14, 1], transition: seq(k, 'slow', [0, 0.45, 1], ['standard', 'emphasized']) },
    },
    handle: {
      rest: { x: 0, y: 0, transition: k.tween('fast') },
      active: { x: [0, 1, 0], y: [0, 1, 0], transition: seq(k, 'slow', [0, 0.45, 1], ['standard', 'emphasized']) },
    },
    glint: {
      rest: { ...hidden, transition: k.tween('fast') },
      active: drawIn(k, 'base', k.duration('fast'), 'standard'),
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.lens} style={origin(10.5, 10.5)}>
        <circle cx="10.5" cy="10.5" r="7" />
        <m.path d="M7 10.5 A3.5 3.5 0 0 1 10.5 7" variants={v.glint} />
      </m.g>
      <m.path d="M15.5 15.5 L20.5 20.5" variants={v.handle} />
    </>
  ),
})
