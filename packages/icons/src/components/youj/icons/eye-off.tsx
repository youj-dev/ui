import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/* eye's hidden pose, baked: the same outline, the pupil at three quarters and
 * the slash with its gap cut behind it. */
const OUTLINE = 'M2.5 12 C4.5 7.8 8 5.5 12 5.5 C16 5.5 19.5 7.8 21.5 12 C19.5 16.2 16 18.5 12 18.5 C8 18.5 4.5 16.2 2.5 12 Z'
const SLASH = 'M3.5 3.5 L20.5 20.5'

/** Hidden. The eye blinks behind the slash, which holds. */
export const EyeOffIcon = createIcon({
  name: 'eye-off',
  category: 'system',
  keywords: ['hidden', 'hide', 'invisible', 'password', 'private', 'conceal', 'visibility', 'eye off', 'eye-off'],
  variants: (k) => {
    const blink = { ...k.tween('slow'), times: [0, 0.35, 1] }
    return {
      lid: {
        rest: { scaleY: 1, transition: k.tween('fast') },
        active: { scaleY: [null, 0.1, 1], transition: blink },
      },
      pupil: {
        rest: { scale: 1, transition: k.tween('fast') },
        active: { scale: [null, 0, 1], transition: blink },
      },
    }
  },
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <path d={SLASH} stroke="black" strokeWidth={4.5} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <m.g variants={v.lid} style={origin(12, 12)}>
          <path d={OUTLINE} />
          <m.circle cx="12" cy="12" r="2.25" variants={v.pupil} style={origin(12, 12)} />
        </m.g>
      </g>
      <path d={SLASH} />
    </>
  ),
})
