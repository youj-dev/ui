import { m } from 'motion/react'
import { createIcon, after, origin, seq } from './icon-base'

/* The exclamation's bar becomes the check's long stroke and its dot the short
 * one; both meet at the check's vertex (11, 14). */
const BAR = 'M12 7.5 L12 12'
const DOT = 'M12 15.5 L12.01 15.5'
const LONG = 'M15 10 L11 14'
const SHORT = 'M9 12 L11 14'

/**
 * Alert ↔ resolved. The shield braces, the exclamation bar tips over into
 * the long stroke of a check and its dot stretches into the short one.
 * `active` = resolved.
 */
export const ShieldAlertIcon = createIcon({
  name: 'shield-alert',
  category: 'security',
  keywords: ['warning', 'threat', 'risk', 'vulnerability', 'security', 'resolved', 'incident'],
  states: ['alert', 'resolved'],
  variants: (k) => ({
    shield: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.92, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
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
    <m.g variants={v.shield} style={origin(12, 12)}>
      <path d="M12 21.5 C7.5 20 4.5 16.5 4.5 12 V6 L12 2.75 L19.5 6 V12 C19.5 16.5 16.5 20 12 21.5 Z" />
      <m.path d={BAR} variants={v.bar} />
      <m.path d={DOT} variants={v.dot} />
    </m.g>
  ),
})
