import { m } from 'motion/react'
import { createIcon, drawOut, drawn, origin } from './icon-base'

const HANDSET =
  'M5 3.5 H8 L9.5 7.5 L7.5 9 A11 11 0 0 0 15 16.5 L16.5 14.5 L20.5 16 V19 A2 2 0 0 1 18.5 21 A16 16 0 0 1 3 5.5 A2 2 0 0 1 5 3.5 Z'

/**
 * Call ↔ hang up. The signal arcs retract into the earpiece, outermost first,
 * and the handset turns 135° into the hang-up pose. Reconnecting turns it back
 * and the arcs radiate out again. `active` = in a call (shows hang up).
 */
export const PhoneCallIcon = createIcon({
  name: 'phone-call',
  category: 'communication',
  keywords: ['call', 'calling', 'hang up', 'end call', 'phone', 'dial', 'ringing'],
  states: ['call', 'hang up'],
  variants: (k) => {
    const s = k.stagger('loose')
    const turn = k.duration('base')
    return {
      // Lying flat the handset is 23 units wide, so the hang-up pose tucks it
      // in to 80% and drops it onto the optical center.
      handset: {
        rest: { rotate: 0, scale: 1, y: 0, transition: k.spring('smooth') },
        active: { rotate: 135, scale: 0.8, y: 1.5, transition: { ...k.spring('smooth'), delay: k.duration('fast') } },
      },
      inner: { rest: drawn(k, 'base', turn), active: drawOut(k, 'fast', s) },
      outer: { rest: drawn(k, 'base', turn + s), active: drawOut(k, 'fast') },
    }
  },
  render: (v) => (
    <>
      <m.path d={HANDSET} variants={v.handset} style={origin(12, 12)} />
      <m.path d="M14.5 6.5 A3 3 0 0 1 17.5 9.5" variants={v.inner} />
      <m.path d="M14.5 3 A6.5 6.5 0 0 1 21 9.5" variants={v.outer} />
    </>
  ),
})
