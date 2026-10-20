import { m } from 'motion/react'
import { createIcon, origin, seqFor } from './icon-base'

/** Picked up. The case lifts by its handle, sways once as it hangs, and is set back down. */
export const BriefcaseIcon = createIcon({
  name: 'briefcase',
  category: 'commerce',
  keywords: ['work', 'job', 'business', 'portfolio', 'career', 'office', 'bag', 'case', 'briefcase-business'],
  variants: (k) => {
    const length = k.duration('deliberate') * 1.2
    return {
      case: {
        rest: { y: 0, rotate: 0, transition: k.tween('base') },
        active: {
          y: [null, -1.25, -1.25, 0],
          rotate: [null, 4, -2.5, 1, 0],
          transition: {
            y: seqFor(k, length, [0, 0.22, 0.78, 1], ['standard', 'linear', 'emphasized']),
            rotate: seqFor(k, length, [0, 0.3, 0.55, 0.8, 1], ['standard', 'standard', 'standard', 'emphasized']),
          },
        },
      },
    }
  },
  render: (v) => (
    <m.g variants={v.case} style={origin(12, 4)}>
      <path d="M9 7 V5.75 A1.75 1.75 0 0 1 10.75 4 H13.25 A1.75 1.75 0 0 1 15 5.75 V7" />
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M3 12.5 H10.25" />
      <path d="M13.75 12.5 H21" />
      <rect x="10.25" y="11" width="3.5" height="3" rx="1" />
    </m.g>
  ),
})
