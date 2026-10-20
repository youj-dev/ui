import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden } from './icon-base'

/** The ring is drawn from twelve o'clock, then the check is written inside it. */
export const CheckCircleIcon = createIcon({
  name: 'check-circle',
  category: 'status',
  keywords: ['success', 'done', 'complete', 'verified', 'approved'],
  variants: (k) => ({
    ring: { from: hidden, rest: drawn(k), active: drawIn(k, 'deliberate', 0, 'emphasized') },
    check: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', k.duration('slow')) },
  }),
  render: (v) => (
    <>
      <m.path d="M12 3 A9 9 0 1 1 12 21 A9 9 0 1 1 12 3" variants={v.ring} />
      <m.path d="M8 12 L11 15 L16 10" variants={v.check} />
    </>
  ),
})
