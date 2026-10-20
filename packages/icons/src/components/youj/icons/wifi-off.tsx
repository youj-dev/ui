import { m } from 'motion/react'
import { createIcon, drawOut, drawn, seq } from './icon-base'

/* wifi's arcs and source dot, innermost first. */
const ARCS = ['M9.17 15.17 A4 4 0 0 1 14.83 15.17', 'M6.34 12.34 A8 8 0 0 1 17.66 12.34', 'M3.51 9.51 A12 12 0 0 1 20.49 9.51']
const SLASH = 'M3.5 3.5 L20.5 20.5'

/**
 * Offline ↔ online. The slash is pulled out and the gap closes, then the
 * signal comes back from the source outward, one arc at a time; dropping
 * the connection strikes the slash back through. `active` = online.
 */
export const WifiOffIcon = createIcon({
  name: 'wifi-off',
  category: 'system',
  keywords: ['offline', 'no internet', 'disconnected', 'network', 'wireless', 'airplane', 'online'],
  states: ['offline', 'online'],
  variants: (k) => {
    const s = k.stagger('loose')
    const arc = (i: number) => ({
      rest: { opacity: 1, transition: k.tween('fast') },
      active: { opacity: [null, 0.15, 1], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'enter'], k.duration('fast') + i * s) },
    })
    return {
      slash: { rest: drawn(k, 'base'), active: drawOut(k, 'fast') },
      a0: arc(0),
      a1: arc(1),
      a2: arc(2),
    }
  },
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d={SLASH} stroke="black" strokeWidth={4.5} variants={v.slash} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <path d="M12 18.5 h.01" strokeWidth={2.25} />
        {ARCS.map((d, i) => (
          <m.path key={d} d={d} variants={v[`a${i}` as 'a0']} />
        ))}
      </g>
      <m.path d={SLASH} variants={v.slash} />
    </>
  ),
})
