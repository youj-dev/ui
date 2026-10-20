import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const SHIELD = 'M12 21.5 C7.5 20 4.5 16.5 4.5 12 V6 L12 2.75 L19.5 6 V12 C19.5 16.5 16.5 20 12 21.5 Z'

/** Deflect: the shield braces against a hit and a force field ripples out from its center through the outline. */
export const ShieldIcon = createIcon({
  name: 'shield',
  category: 'security',
  keywords: ['security', 'protection', 'safe', 'defense', 'guard', 'firewall', 'privacy'],
  variants: (k) => ({
    shield: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0.92, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    ripple: {
      rest: { scale: 0.4, opacity: 0, transition: k.tween('fast') },
      active: {
        scale: [0.4, 0.4, 1.12],
        opacity: [0, 0.9, 0],
        transition: { scale: seq(k, 'deliberate', [0, 0.2, 1], ['linear', 'enter']), opacity: seq(k, 'deliberate', [0, 0.25, 1], ['linear', 'exit']) },
      },
    },
  }),
  render: (v) => (
    <>
      <m.path d={SHIELD} variants={v.ripple} style={origin(12, 12)} />
      <m.path d={SHIELD} variants={v.shield} style={origin(12, 12)} />
    </>
  ),
})
