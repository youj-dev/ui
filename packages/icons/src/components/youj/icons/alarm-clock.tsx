import { m } from 'motion/react'
import { createIcon, drawOut, drawn, origin, seqFor } from './icon-base'

const SHAKE = [0, -9, 9, -9, 9, -9, 9, -6, 6, 0]

/**
 * Silent ↔ ringing. The alarm goes off: the clock rattles on its feet and sound
 * arcs open on both sides, and they stay while it rings. Silencing it closes
 * the arcs and lets the clock settle. `active` = ringing.
 */
export const AlarmClockIcon = createIcon({
  name: 'alarm-clock',
  category: 'time',
  keywords: ['alarm', 'wake up', 'reminder', 'ringing', 'timer', 'snooze', 'morning'],
  states: ['silent', 'ringing'],
  variants: (k) => {
    const shake = seqFor(
      k,
      k.duration('deliberate') * 1.5,
      SHAKE.map((_, i) => i / (SHAKE.length - 1)),
      SHAKE.slice(1).map(() => 'standard' as const),
    )
    return {
      clock: {
        rest: { rotate: 0, transition: k.tween('base') },
        active: { rotate: [null, ...SHAKE.slice(1)], transition: shake },
      },
      left: { rest: drawOut(k, 'fast'), active: drawn(k, 'base', k.duration('fast')) },
      right: { rest: drawOut(k, 'fast'), active: drawn(k, 'base', k.duration('fast') + k.stagger('base')) },
    }
  },
  render: (v) => (
    <>
      <m.g variants={v.clock} style={origin(12, 13)}>
        <circle cx="12" cy="13" r="7" />
        <path d="M12 13 V9.5" />
        <path d="M12 13 L14 15" />
        <path d="M3.5 6.5 L6.5 3.5" />
        <path d="M17.5 3.5 L20.5 6.5" />
        <path d="M7.05 17.95 L5 20" />
        <path d="M16.95 17.95 L19 20" />
      </m.g>
      <m.path d="M2.97 10.06 A9.5 9.5 0 0 0 2.97 15.94" variants={v.left} />
      <m.path d="M21.03 10.06 A9.5 9.5 0 0 1 21.03 15.94" variants={v.right} />
    </>
  ),
})
