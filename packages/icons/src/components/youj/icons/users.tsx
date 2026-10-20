import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The group acknowledges you: a nod runs from the front person to the one behind. */
export const UsersIcon = createIcon({
  name: 'users',
  category: 'people',
  keywords: ['team', 'group', 'members', 'people', 'contacts', 'community'],
  variants: (k) => {
    const nod = (delay: number) => ({
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1.5, -0.5, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.62, 1], ['standard', 'standard', 'emphasized'], delay) },
    })
    return { front: nod(0), back: nod(k.stagger('loose') * 2) }
  },
  render: (v) => (
    <>
      <m.circle cx="9" cy="8" r="3.5" variants={v.front} />
      <path d="M3 20.5 V19.5 A5.5 5.5 0 0 1 8.5 14 H9.5 A5.5 5.5 0 0 1 15 19.5 V20.5" />
      <m.path d="M16 4.54 A3.5 3.5 0 0 1 16 11.46" variants={v.back} />
      <path d="M17.88 14.33 A5.5 5.5 0 0 1 21.5 19.5 V20.5" />
    </>
  ),
})
