import { m } from 'motion/react'
import { after, createIcon, drawOut, drawn, origin, type IconVariants } from './icon-base'

/* Both lids are eye's outline split at the corners, two cubics each. Closed,
 * they land on one shared curve, so the upper lid swings down through a
 * straight line (a blink) and the lower lid rises to meet it. */
const UPPER = 'M2.5 12 C4.5 7.8 8 5.5 12 5.5 C16 5.5 19.5 7.8 21.5 12'
const LOWER = 'M2.5 12 C4.5 16.2 8 18.5 12 18.5 C16 18.5 19.5 16.2 21.5 12'
const SHUT = 'M2.5 10 C4.5 13 8 14.5 12 14.5 C16 14.5 19.5 13 21.5 10'
/* Lashes grow out of the shut lid along its normals, outer pair first. */
const LASHES = ['M4.68 12.29 L3.33 14.1', 'M19.32 12.29 L20.67 14.1', 'M8.56 14.09 L7.96 16.52', 'M15.44 14.09 L16.04 16.52']

/**
 * Open ↔ closed, for password fields and hide-content toggles. The upper lid
 * sweeps down in a blink and meets the lower one as the pupil shrinks away,
 * then the lashes grow out of the closed lid; opening folds the lashes in
 * first. `active` = closed.
 */
export const EyeClosedIcon = createIcon({
  name: 'eye-closed',
  category: 'system',
  keywords: ['hide', 'hidden', 'password', 'private', 'closed eye', 'conceal', 'show'],
  states: ['open', 'closed'],
  variants: (k): IconVariants => {
    const s = k.stagger('tight')
    const opens = k.duration('fast')
    const lid = (open: string) => ({
      rest: { d: open, transition: after(k, opens, 'base') },
      active: { d: SHUT, transition: k.tween('base', 'emphasized') },
    })
    return {
      upper: lid(UPPER),
      lower: lid(LOWER),
      pupil: {
        rest: { scale: 1, opacity: 1, transition: { ...k.spring('snappy'), delay: opens + k.duration('instant') } },
        active: { scale: 0, opacity: 0, transition: k.tween('fast', 'exit') },
      },
      ...Object.fromEntries(
        LASHES.map((_, i) => [`l${i}`, { rest: drawOut(k, 'instant', (i >> 1) * s), active: drawn(k, 'fast', k.duration('base') + (i >> 1) * s) }]),
      ),
    }
  },
  render: (v) => (
    <>
      <m.path d={UPPER} variants={v.upper} />
      <m.path d={LOWER} variants={v.lower} />
      <m.circle cx="12" cy="12" r="3" variants={v.pupil} style={origin(12, 12)} />
      {LASHES.map((d, i) => (
        <m.path key={d} d={d} variants={v[`l${i}`]} />
      ))}
    </>
  ),
})
