import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Add protection: the shield braces and the plus inside it turns a quarter. */
export const ShieldPlusIcon = createIcon({
  name: 'shield-plus',
  category: 'security',
  keywords: ['add security', 'insurance', 'health cover', 'protect', 'add guard', 'first aid'],
  variants: (k) => ({
    shield: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0.92, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    cross: {
      rest: { rotate: 0, transition: k.spring('snappy') },
      active: { rotate: 90, transition: k.spring('snappy') },
    },
  }),
  render: (v) => (
    <m.g variants={v.shield} style={origin(12, 12)}>
      <path d="M12 21.5 C7.5 20 4.5 16.5 4.5 12 V6 L12 2.75 L19.5 6 V12 C19.5 16.5 16.5 20 12 21.5 Z" />
      <m.g variants={v.cross} style={origin(12, 12)}>
        <path d="M12 9 V15" />
        <path d="M9 12 H15" />
      </m.g>
    </m.g>
  ),
})
