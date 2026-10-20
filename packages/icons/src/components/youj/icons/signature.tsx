import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden } from './icon-base'

/** Signing: the pen writes the signature again in one stroke, above the line it is signed on. */
export const SignatureIcon = createIcon({
  name: 'signature',
  category: 'editor',
  keywords: ['sign', 'signature', 'e-sign', 'contract', 'approve', 'autograph', 'document'],
  variants: (k) => ({
    name: { from: hidden, rest: drawn(k), active: drawIn(k, 'deliberate', 0, 'emphasized') },
  }),
  render: (v) => (
    <>
      <m.path
        d="M3 17 C5 14 6.5 9.5 8.5 10 C10.25 10.5 7.75 16.5 9.5 17 C11.25 17.5 12.5 12.5 14.5 13 C16 13.4 14.75 16.25 16.5 16.5 C18 16.7 19.5 15 21 14.5"
        variants={v.name}
      />
      <path d="M3 20.5 H21" />
    </>
  ),
})
