import { m } from 'motion/react'
import { after, createIcon, drawOut, drawn, origin, type IconVariants } from './icon-base'

/* link's halves and bar. The break throws four sparks, drawn outward from the gap. */
const SPARKS = ['M10.25 6.75 L9.25 5.25', 'M13.75 6.75 L14.75 5.25', 'M10.25 17.25 L9.25 18.75', 'M13.75 17.25 L14.75 18.75']

/**
 * Linked ↔ unlinked, for links and locked aspect ratios. The bar snaps and
 * the halves spring apart, throwing sparks from the break; relinking pulls
 * them back together and the bar rejoins them. `active` = unlinked.
 */
export const UnlinkIcon = createIcon({
  name: 'unlink',
  category: 'actions',
  keywords: ['unlink', 'remove link', 'break', 'detach', 'disconnect', 'chain', 'aspect ratio'],
  states: ['linked', 'unlinked'],
  variants: (k): IconVariants => {
    const snap = k.duration('fast')
    const half = (dir: 1 | -1) => ({
      rest: { x: 0, transition: k.spring('snappy') },
      active: { x: dir * 1.5, transition: { ...k.spring('snappy'), delay: k.duration('instant') } },
    })
    return {
      left: half(-1),
      right: half(1),
      bar: {
        rest: { scaleX: 1, opacity: 1, transition: after(k, snap, 'base', 'enter') },
        active: { scaleX: 0, opacity: 0, transition: k.tween('fast', 'exit') },
      },
      ...Object.fromEntries(SPARKS.map((_, i) => [`s${i}`, { rest: drawOut(k, 'fast'), active: drawn(k, 'base', snap + (i % 2) * k.stagger('tight')) }])),
    }
  },
  render: (v) => (
    <>
      <m.path d="M9 16.5 H7.5 A4.5 4.5 0 0 1 7.5 7.5 H9" variants={v.left} />
      <m.path d="M15 7.5 H16.5 A4.5 4.5 0 0 1 16.5 16.5 H15" variants={v.right} />
      <m.path d="M8.5 12 H15.5" variants={v.bar} style={origin(12, 12)} />
      {SPARKS.map((d, i) => (
        <m.path key={d} d={d} variants={v[`s${i}`]} />
      ))}
    </>
  ),
})
