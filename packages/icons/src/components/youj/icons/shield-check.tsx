import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, origin, seq } from './icon-base'

/** The shield braces (a short squash) and the check is re-sealed onto it. */
export const ShieldCheckIcon = createIcon({
  name: 'shield-check',
  category: 'security',
  keywords: ['security', 'protected', 'verified', 'safe', 'privacy', 'trust'],
  variants: (k) => ({
    shield: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0.9, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    check: {
      from: { ...hidden, scale: 0.9 },
      rest: { ...drawn(k), scale: 1 },
      active: {
        ...drawIn(k, 'slow', k.duration('fast')),
        scale: [0.85, 1],
        transition: { ...drawIn(k, 'slow', k.duration('fast')).transition, scale: { ...k.spring('settle'), delay: k.duration('slow') } },
      },
    },
  }),
  render: (v) => (
    <m.g variants={v.shield} style={origin(12, 12)}>
      <path d="M12 21.5 C7.5 20 4.5 16.5 4.5 12 V6 L12 2.75 L19.5 6 V12 C19.5 16.5 16.5 20 12 21.5 Z" />
      <m.path d="M9 12 L11 14 L15 10" variants={v.check} style={origin(12, 12)} />
    </m.g>
  ),
})
