import { m } from 'motion/react'
import { createIcon, after } from './icon-base'

/* The bit (end tooth) and the tooth before it flip across the blade as the
 * key turns. Halfway they lie flat along it: the key seen edge-on. */
const BLADE = 'M9.42 14.58 L19.14 4.86 L21.09 6.8'
const BLADE_TURNED = 'M9.42 14.58 L19.14 4.86 L17.2 2.91'
const TOOTH = 'M17.02 6.98 L18.97 8.92'
const TOOTH_TURNED = 'M17.02 6.98 L15.08 5.03'

/** Into the lock: the key pushes in along its blade and turns, its teeth flipping over to the far side; releasing turns it back and draws it out. */
export const KeyIcon = createIcon({
  name: 'key',
  category: 'security',
  keywords: ['password', 'access', 'api key', 'credentials', 'unlock', 'secret', 'auth'],
  variants: (k) => {
    const turn = k.duration('base') * 0.8
    const bit = (from: string, to: string) => ({
      rest: { d: from, transition: k.tween('base', 'standard') },
      active: { d: to, transition: after(k, turn, 'slow', 'emphasized') },
    })
    return {
      key: {
        rest: { x: 0, y: 0, transition: after(k, k.duration('base'), 'base') },
        active: { x: 0.5, y: -0.5, transition: k.tween('base', 'emphasized') },
      },
      blade: bit(BLADE, BLADE_TURNED),
      tooth: bit(TOOTH, TOOTH_TURNED),
    }
  },
  render: (v) => (
    <m.g variants={v.key}>
      <circle cx="7.3" cy="16.7" r="3" />
      <m.path d={BLADE} variants={v.blade} />
      <m.path d={TOOTH} variants={v.tooth} />
    </m.g>
  ),
})
