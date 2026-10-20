import { m } from 'motion/react'
import { after, createIcon, type IconVariants } from './icon-base'

/* The chevron keeps its apex's direction and swings from pointing down to
 * pointing right; each child line folds up onto the parent's line and is
 * gone under it. */
const CHEVRON = ['M3.5 5 L5.5 7 L7.5 5', 'M4.5 4 L6.5 6 L4.5 8'] as const
const CHILDREN = [
  ['M13 12 H21', 'M13 6 H21'],
  ['M13 18 H21', 'M13 6 H21'],
] as const

/**
 * Expanded ↔ collapsed, for outlines, trees and collapse-all. The children
 * fold up into their parent row, last one first, and the chevron turns to
 * point right; expanding drops them back out under it. `active` = collapsed.
 */
export const ListCollapseIcon = createIcon({
  name: 'list-collapse',
  category: 'navigation',
  keywords: ['collapse', 'expand', 'collapse all', 'outline', 'tree', 'fold', 'nested list'],
  states: ['expanded', 'collapsed'],
  variants: (k): IconVariants => {
    const s = k.stagger('base')
    return {
      chevron: {
        rest: { d: CHEVRON[0], transition: k.spring('snappy') },
        active: { d: CHEVRON[1], transition: k.spring('snappy') },
      },
      ...Object.fromEntries(
        CHILDREN.map(([open, folded], i) => [
          `c${i}`,
          {
            rest: { d: open, opacity: 1, transition: { d: after(k, i * s, 'base', 'emphasized'), opacity: after(k, i * s, 'instant') } },
            active: {
              d: folded,
              opacity: 0,
              transition: { d: after(k, (1 - i) * s, 'base', 'emphasized'), opacity: after(k, (1 - i) * s + k.duration('base') - k.duration('instant'), 'instant') },
            },
          },
        ]),
      ),
    }
  },
  render: (v) => (
    <>
      <m.path d={CHEVRON[0]} variants={v.chevron} />
      <path d="M10 6 H21" />
      <m.path d={CHILDREN[0][0]} variants={v.c0} />
      <m.path d={CHILDREN[1][0]} variants={v.c1} />
    </>
  ),
})
