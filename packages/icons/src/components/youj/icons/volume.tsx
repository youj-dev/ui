import { m } from 'motion/react'
import { createIcon, drawIn, drawOut, drawn } from './icon-base'

/**
 * Volume ↔ muted. The sound waves retract outermost-first, then the × is
 * crossed out stroke by stroke. Unmuting plays it back in reverse order.
 */
export const VolumeIcon = createIcon({
  name: 'volume',
  category: 'media',
  keywords: ['sound', 'audio', 'speaker', 'mute', 'unmute', 'loud'],
  states: ['sound on', 'muted'],
  variants: (k) => {
    const s = k.stagger('loose')
    return {
      outer: { rest: drawn(k, 'base', s * 3), active: drawOut(k, 'fast') },
      inner: { rest: drawn(k, 'base', s * 2), active: drawOut(k, 'fast', s) },
      x1: { rest: drawOut(k, 'fast', s), active: drawIn(k, 'base', s * 2, 'standard') },
      x2: { rest: drawOut(k, 'fast'), active: drawIn(k, 'base', s * 3, 'standard') },
    }
  },
  render: (v) => (
    <>
      <path d="M11 5 L6.5 9 H4 A1 1 0 0 0 3 10 V14 A1 1 0 0 0 4 15 H6.5 L11 19 Z" />
      <m.path d="M15 9 A4 4 0 0 1 15 15" variants={v.inner} />
      <m.path d="M18 6 A8.5 8.5 0 0 1 18 18" variants={v.outer} />
      <m.path d="M16 9.5 L21 14.5" variants={v.x1} />
      <m.path d="M21 9.5 L16 14.5" variants={v.x2} />
    </>
  ),
})
