import { m } from 'motion/react'
import { createIcon, origin, seqFor } from './icon-base'

/** A wink: the face tilts, one eye squeezes shut and the smile widens, then it all relaxes. */
export const SmileIcon = createIcon({
  name: 'smile',
  category: 'people',
  keywords: ['emoji', 'happy', 'face', 'reaction', 'feedback', 'wink', 'mood'],
  variants: (k) => {
    const t = seqFor(k, k.duration('deliberate') * 1.25, [0, 0.25, 0.7, 1], ['standard', 'linear', 'emphasized'])
    return {
      face: {
        rest: { rotate: 0, transition: k.tween('fast') },
        active: { rotate: [0, -8, -8, 0], transition: t },
      },
      wink: {
        rest: { scaleX: 1, scaleY: 1, transition: k.tween('fast') },
        active: { scaleX: [1, 1.5, 1.5, 1], scaleY: [1, 0.2, 0.2, 1], transition: t },
      },
      mouth: {
        rest: { scaleX: 1, transition: k.tween('fast') },
        active: { scaleX: [1, 1.12, 1.12, 1], transition: t },
      },
    }
  },
  render: (v) => (
    <m.g variants={v.face} style={origin(12, 12)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9.5 h.01" strokeWidth={2} />
      <m.path d="M15 9.5 h.01" strokeWidth={2} variants={v.wink} style={origin(15, 9.5)} />
      <m.path d="M8.5 14.5 A4 4 0 0 0 15.5 14.5" variants={v.mouth} style={origin(12, 15.5)} />
    </m.g>
  ),
})
