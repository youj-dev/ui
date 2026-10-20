import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Cracking the combination: the wheel turns one way, back the other, and settles. */
export const VaultIcon = createIcon({
  name: 'vault',
  category: 'security',
  keywords: ['safe', 'vault', 'secure storage', 'savings', 'deposit', 'locker', 'treasure'],
  variants: (k) => ({
    dial: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -150, 60, 0], transition: seq(k, 'deliberate', [0, 0.4, 0.75, 1], ['standard', 'standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <rect x="3" y="3.5" width="18" height="15" rx="2" />
      <path d="M6.5 18.5 V20.5" />
      <path d="M17.5 18.5 V20.5" />
      <path d="M5.75 8 V9.5" />
      <path d="M5.75 12.5 V14" />
      <circle cx="13" cy="11" r="3.75" />
      <m.g variants={v.dial} style={origin(13, 11)}>
        <path d="M13 8.9 L13 13.1" />
        <path d="M11.18 9.95 L14.82 12.05" />
        <path d="M14.82 9.95 L11.18 12.05" />
      </m.g>
    </>
  ),
})
