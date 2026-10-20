import { m } from 'motion/react'
import { after, createIcon, type IconVariants } from './icon-base'

/* The chevron keeps its tips' height and trades the apex's x with the tips',
 * so it folds flat and turns over; the indented lines step in with it. */
const CHEVRON = ['M7 9.5 L4.5 12 L7 14.5', 'M4.5 9.5 L7 12 L4.5 14.5'] as const
const LINES = [
  ['M10.5 10 H21', 'M12 10 H21'],
  ['M10.5 14 H21', 'M12 14 H21'],
] as const

/**
 * Outdent ↔ indent. The chevron folds flat and turns to point into the text
 * as the two middle lines step in after it; outdenting turns it back and
 * pulls the lines out. `active` = indent.
 */
export const IndentIcon = createIcon({
  name: 'indent',
  category: 'editor',
  keywords: ['indent', 'outdent', 'increase indent', 'decrease indent', 'nest', 'tab', 'list'],
  states: ['outdent', 'indent'],
  variants: (k): IconVariants => {
    const s = k.stagger('tight')
    return {
      chevron: {
        rest: { d: CHEVRON[0], transition: k.tween('base', 'emphasized') },
        active: { d: CHEVRON[1], transition: k.tween('base', 'emphasized') },
      },
      ...Object.fromEntries(
        LINES.map(([out, into], i) => [
          `l${i}`,
          {
            rest: { d: out, transition: after(k, i * s, 'base') },
            active: { d: into, transition: after(k, k.duration('fast') + i * s, 'base') },
          },
        ]),
      ),
    }
  },
  render: (v) => (
    <>
      <path d="M3 5 H21" />
      <m.path d={CHEVRON[0]} variants={v.chevron} />
      <m.path d={LINES[0][0]} variants={v.l0} />
      <m.path d={LINES[1][0]} variants={v.l1} />
      <path d="M3 19 H21" />
    </>
  ),
})
