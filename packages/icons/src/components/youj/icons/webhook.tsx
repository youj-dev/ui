import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, type IconVariants } from './icon-base'

/* Three hooks in 120° symmetry, each running from one node's center and
 * wrapping the next node. Listed in delivery order: top → left → right → top. */
const HOOKS = [
  'M12 6 L8.44 12.17 C7.84 13.21 6.32 13.29 5.16 13.6 A3 3 0 1 0 7.66 18.96',
  'M5.94 16.5 L13.06 16.5 C14.26 16.5 15.09 17.77 15.94 18.62 A3 3 0 1 0 19.33 13.78',
  'M18.06 16.5 L14.5 10.33 C13.9 9.29 14.59 7.94 14.9 6.78 A3 3 0 1 0 9.01 6.26',
]

/** An event is delivered: the payload is handed from hook to hook around the loop, each one re-traced as it arrives. */
export const WebhookIcon = createIcon({
  name: 'webhook',
  category: 'development',
  keywords: ['event', 'callback', 'integration', 'api', 'trigger', 'endpoint', 'automation'],
  variants: (k): IconVariants =>
    Object.fromEntries(HOOKS.map((_, i) => [`h${i}`, { from: hidden, rest: drawn(k), active: drawIn(k, 'base', i * k.duration('fast'), 'standard') }])),
  render: (v) => (
    <>
      {HOOKS.map((d, i) => (
        <m.path key={d} d={d} variants={v[`h${i}`]} />
      ))}
    </>
  ),
})
