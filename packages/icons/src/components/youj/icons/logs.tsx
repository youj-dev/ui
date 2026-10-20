import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* Five identical rows, a timestamp and a message each, one row pitch (5)
 * apart; the fifth waits below the clip. Rest is scrolled one row, which
 * looks the same as none, so each hover restarts at 0 without a jump. */
const ROWS = [5, 10, 15, 20, 25]

/** Tailing a log: a new line comes in at the bottom and every line above it scrolls up one, the oldest leaving at the top. */
export const LogsIcon = createIcon({
  name: 'logs',
  category: 'development',
  keywords: ['logs', 'console', 'output', 'activity', 'audit log', 'events', 'tail', 'stream'],
  variants: (k) => ({
    scroll: {
      rest: { y: -5, transition: k.tween('base', 'enter') },
      active: { y: [0, -5], transition: k.tween('slow', 'emphasized') },
    },
  }),
  render: (v, { id }) => (
    <>
      <clipPath id={`${id}-c`}>
        <rect x="0" y="2" width="24" height="20" />
      </clipPath>
      <g clipPath={`url(#${id}-c)`}>
        <m.g variants={v.scroll}>
          {ROWS.map((y) => (
            <path key={y} d={`M3 ${y} H5 M8 ${y} H21`} />
          ))}
        </m.g>
      </g>
    </>
  ),
})
