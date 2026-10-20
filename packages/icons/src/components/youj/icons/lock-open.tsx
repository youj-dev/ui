import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* lock's shackle in its unlocked pose, baked: raised by 2 and swung 14° back
 * on its left leg, so a swap between lock and lock-open lines up exactly. */
const SHACKLE = 'M8 9 L7.153 5.604 A4 4 0 0 1 14.916 3.669 L15.762 7.065'

/**
 * Unlocked. The shackle dips toward the body as if about to lock, the
 * keyhole flicks, and it swings back open.
 */
export const LockOpenIcon = createIcon({
  name: 'lock-open',
  category: 'security',
  keywords: ['unlock', 'unlocked', 'open', 'padlock', 'unsecured', 'access', 'lock-open', 'unlocked padlock'],
  variants: (k) => {
    const dip = seq(k, 'slow', [0, 0.42, 1], ['standard', 'emphasized'])
    return {
      shackle: {
        rest: { y: 0, rotate: 0, transition: k.tween('fast') },
        active: { y: [null, 1.25, 0], rotate: [null, 8, 0], transition: dip },
      },
      keyhole: {
        rest: { scaleY: 1, transition: k.tween('fast') },
        active: { scaleY: [null, 0.3, 1], transition: dip },
      },
    }
  },
  render: (v) => (
    <>
      <m.path d={SHACKLE} variants={v.shackle} style={origin(8, 9)} />
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <m.path d="M12 15 V17" variants={v.keyhole} style={origin(12, 16)} />
    </>
  ),
})
