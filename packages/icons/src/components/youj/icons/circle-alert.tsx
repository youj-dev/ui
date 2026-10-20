import { m } from 'motion/react'
import { after, createIcon, origin, seq } from './icon-base'

/* The exclamation's bar becomes the check's long arm and its dot the short
 * one, meeting at the check's vertex (11, 15): check-circle's own check. */
const BAR = 'M12 7.5 L12 12.5'
const DOT = 'M12 16.25 L12.01 16.25'
const LONG = 'M16 10 L11 15'
const SHORT = 'M8 12 L11 15'

/**
 * Alert ↔ resolved. The ring braces, the exclamation bar tips over into the
 * long arm of a check and its dot stretches into the short one; reopening
 * stands the bar back up. `active` = resolved.
 */
export const CircleAlertIcon = createIcon({
  name: 'circle-alert',
  category: 'status',
  keywords: ['error', 'warning', 'alert', 'issue', 'problem', 'resolved', 'validation'],
  states: ['alert', 'resolved'],
  variants: (k) => ({
    ring: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.9, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    bar: {
      rest: { d: BAR, transition: k.tween('base') },
      active: { d: LONG, transition: after(k, k.duration('instant'), 'slow', 'emphasized') },
    },
    dot: {
      rest: { d: DOT, transition: k.tween('base') },
      active: { d: SHORT, transition: after(k, k.duration('instant') + k.stagger('loose'), 'slow', 'emphasized') },
    },
  }),
  render: (v) => (
    <m.g variants={v.ring} style={origin(12, 12)}>
      <circle cx="12" cy="12" r="9" />
      <m.path d={BAR} variants={v.bar} />
      <m.path d={DOT} variants={v.dot} />
    </m.g>
  ),
})
