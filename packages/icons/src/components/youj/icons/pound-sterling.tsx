import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** Money in pounds: the stroke is written again from the hook down to the foot. */
export const PoundSterlingIcon = createIcon({
  name: 'pound-sterling',
  category: 'commerce',
  keywords: ['pound', 'gbp', 'sterling', 'currency', 'money', 'uk'],
  variants: (k) => ({
    glyph: { rest: drawn(k), active: drawIn(k, 'deliberate', 0, 'standard') },
  }),
  render: (v) => (
    <>
      <m.path d="M16.5 7 A4 4 0 0 0 9 9 V14.5 C9 16.5 8.5 18 7 19.5 H17" variants={v.glyph} />
      <path d="M6.5 12.5 H13.5" />
    </>
  ),
})
