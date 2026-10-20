import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden } from './icon-base'

/** Power on: the switch line drops in, then the ring is drawn closed around it from both sides. */
export const PowerIcon = createIcon({
  name: 'power',
  category: 'system',
  keywords: ['on', 'off', 'shutdown', 'start', 'boot', 'switch'],
  variants: (k) => ({
    line: { from: hidden, rest: drawn(k), active: drawIn(k, 'base', 0, 'standard') },
    left: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', k.duration('fast')) },
    right: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', k.duration('fast')) },
  }),
  render: (v) => (
    <>
      <m.path d="M12 3 V11" variants={v.line} />
      <m.path d="M12 21.25 A8.5 8.5 0 0 1 5.99 6.74" variants={v.left} />
      <m.path d="M12 21.25 A8.5 8.5 0 0 0 18.01 6.74" variants={v.right} />
    </>
  ),
})
