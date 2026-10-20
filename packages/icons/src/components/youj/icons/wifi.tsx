import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

const ARCS = ['M9.17 15.17 A4 4 0 0 1 14.83 15.17', 'M6.34 12.34 A8 8 0 0 1 17.66 12.34', 'M3.51 9.51 A12 12 0 0 1 20.49 9.51']

/** Searching for signal: the arcs go dark, then light up from the source outward. */
export const WifiIcon = createIcon({
  name: 'wifi',
  category: 'system',
  keywords: ['signal', 'network', 'wireless', 'internet', 'connection', 'online'],
  variants: (k) => {
    const arc = (i: number) => ({
      rest: { opacity: 1, transition: k.tween('fast') },
      active: {
        opacity: [1, 0.15, 0.15, 1],
        transition: seq(k, 'deliberate', [0, 0.15, 0.35 + i * 0.18, 0.55 + i * 0.18], ['exit', 'linear', 'enter']),
      },
    })
    return { a0: arc(0), a1: arc(1), a2: arc(2) }
  },
  render: (v) => (
    <>
      <path d="M12 18.5 h.01" strokeWidth={2.25} />
      {ARCS.map((d, i) => (
        <m.path key={d} d={d} variants={v[`a${i}` as 'a0']} />
      ))}
    </>
  ),
})
