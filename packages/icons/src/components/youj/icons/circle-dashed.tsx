import { m } from 'motion/react'
import { after, createIcon, drawOut, drawn, origin, type IconVariants } from './icon-base'

/* Eight dashes centered on the compass points of the r9 ring, each one cubic.
 * Done, each dash grows to fill its 45° slot, so neighbors meet end to end
 * and the round caps close the ring without a seam. */
const DASHES = [
  ['M10.24 3.17 C11.4 2.94 12.6 2.94 13.76 3.17', 'M8.56 3.69 C10.76 2.77 13.24 2.77 15.44 3.69'],
  ['M17 4.52 C17.98 5.17 18.83 6.02 19.48 7', 'M15.44 3.69 C17.65 4.6 19.4 6.35 20.31 8.56'],
  ['M20.83 10.24 C21.06 11.4 21.06 12.6 20.83 13.76', 'M20.31 8.56 C21.23 10.76 21.23 13.24 20.31 15.44'],
  ['M19.48 17 C18.83 17.98 17.98 18.83 17 19.48', 'M20.31 15.44 C19.4 17.65 17.65 19.4 15.44 20.31'],
  ['M13.76 20.83 C12.6 21.06 11.4 21.06 10.24 20.83', 'M15.44 20.31 C13.24 21.23 10.76 21.23 8.56 20.31'],
  ['M7 19.48 C6.02 18.83 5.17 17.98 4.52 17', 'M8.56 20.31 C6.35 19.4 4.6 17.65 3.69 15.44'],
  ['M3.17 13.76 C2.94 12.6 2.94 11.4 3.17 10.24', 'M3.69 15.44 C2.77 13.24 2.77 10.76 3.69 8.56'],
  ['M4.52 7 C5.17 6.02 6.02 5.17 7 4.52', 'M3.69 8.56 C4.6 6.35 6.35 4.6 8.56 3.69'],
] as const

/**
 * Pending ↔ done. The dashes chase round the ring like a loader and close
 * their gaps one after another, then a check is written inside and lands
 * with a settle. Undoing erases the check and breaks the ring back into
 * dashes. `active` = done.
 */
export const CircleDashedIcon = createIcon({
  name: 'circle-dashed',
  category: 'status',
  keywords: ['pending', 'todo', 'draft', 'loading', 'progress', 'done', 'complete', 'status'],
  states: ['pending', 'done'],
  variants: (k): IconVariants => {
    const s = k.stagger('tight')
    const close = k.duration('fast')
    const last = DASHES.length - 1
    return {
      ring: {
        rest: { rotate: 0, transition: k.tween('slow') },
        active: { rotate: 90, transition: k.tween('deliberate', 'emphasized') },
      },
      ...Object.fromEntries(
        DASHES.map(([dash, slot], i) => [
          `d${i}`,
          {
            rest: { d: dash, transition: after(k, (last - i) * s * 0.5, 'base') },
            active: { d: slot, transition: after(k, close + i * s, 'slow', 'emphasized') },
          },
        ]),
      ),
      check: {
        rest: { ...drawOut(k, 'fast'), scale: 0.7, transition: { ...drawOut(k, 'fast').transition, scale: k.tween('fast', 'exit') } },
        active: {
          ...drawn(k, 'base', close + last * s + k.duration('base')),
          scale: 1,
          transition: { ...drawn(k, 'base', close + last * s + k.duration('base')).transition, scale: { ...k.spring('settle'), delay: close + last * s + k.duration('base') } },
        },
      },
    }
  },
  render: (v) => (
    <>
      <m.g variants={v.ring} style={origin(12, 12)}>
        {DASHES.map(([dash], i) => (
          <m.path key={dash} d={dash} variants={v[`d${i}`]} />
        ))}
      </m.g>
      <m.path d="M8 12 L11 15 L16 10" variants={v.check} style={origin(12, 12.5)} />
    </>
  ),
})
