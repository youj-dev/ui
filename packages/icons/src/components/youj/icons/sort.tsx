import { m } from 'motion/react'
import { after, createIcon, type IconVariants } from './icon-base'

/* The arrow always points at the long bar. Its head keeps the tips' x and
 * trades the apex's height with the tips', so it folds flat across the
 * shaft and turns over, as chevrons-up-down does. The outer bars trade
 * lengths; the middle one stays. */
const HEAD = ['M3.5 16.5 L7 20 L10.5 16.5', 'M3.5 7.5 L7 4 L10.5 7.5'] as const
const BARS = [
  ['M13.5 5.5 H16.5', 'M13.5 5.5 H21'],
  ['M13.5 18.5 H21', 'M13.5 18.5 H16.5'],
] as const

/**
 * Ascending ↔ descending. The arrow's head folds flat across the shaft and
 * turns over to point the other way while the top and bottom bars trade
 * lengths, top first. `active` = descending.
 */
export const SortIcon = createIcon({
  name: 'sort',
  category: 'actions',
  keywords: ['sort', 'order', 'ascending', 'descending', 'arrange', 'rank', 'a-z', 'column'],
  states: ['ascending', 'descending'],
  variants: (k): IconVariants => {
    const s = k.stagger('base')
    return {
      head: {
        rest: { d: HEAD[0], transition: k.tween('base', 'emphasized') },
        active: { d: HEAD[1], transition: k.tween('base', 'emphasized') },
      },
      ...Object.fromEntries(
        BARS.map(([asc, desc], i) => [
          `b${i}`,
          {
            rest: { d: asc, transition: after(k, i * s, 'base') },
            active: { d: desc, transition: after(k, i * s, 'base') },
          },
        ]),
      ),
    }
  },
  render: (v) => (
    <>
      <path d="M7 4 V20" />
      <m.path d={HEAD[0]} variants={v.head} />
      <m.path d={BARS[0][0]} variants={v.b0} />
      <path d="M13.5 12 H18.75" />
      <m.path d={BARS[1][0]} variants={v.b1} />
    </>
  ),
})
