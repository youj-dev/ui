import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* A compact doorway: a 15-unit bracket with 2-unit arms and 2.5-unit
 * corners, drawn with cubic corners so both sides share one command
 * structure. Interpolating from the right-hand frame to the left-hand one
 * passes through a vertical line: the door seen edge-on as it swings. */
const DOOR_RIGHT = 'M16 4.5 L18 4.5 C19.38 4.5 20.5 5.62 20.5 7 L20.5 17 C20.5 18.38 19.38 19.5 18 19.5 L16 19.5'
const DOOR_LEFT = 'M8 4.5 L6 4.5 C4.62 4.5 3.5 5.62 3.5 7 L3.5 17 C3.5 18.38 4.62 19.5 6 19.5 L8 19.5'

/**
 * Log in ↔ log out. The arrow walks through the doorway while the door swings
 * round behind it, edge-on half-way, so the same frame now shows the way out.
 * Toggling mid-swing sends both back. `active` = log out (signed in).
 */
export const LogInIcon = createIcon({
  name: 'log-in',
  category: 'navigation',
  keywords: ['sign in', 'login', 'enter', 'sign out', 'logout', 'account', 'auth'],
  states: ['log in', 'log out'],
  variants: (k) => {
    const lag = k.stagger('loose')
    return {
      door: {
        rest: { d: DOOR_RIGHT, transition: k.spring('smooth') },
        active: { d: DOOR_LEFT, transition: { ...k.spring('smooth'), delay: lag } },
      },
      arrow: {
        rest: { x: 0, transition: { ...k.spring('smooth'), delay: lag } },
        active: { x: 6, transition: k.spring('smooth') },
      },
    }
  },
  render: (v) => (
    <>
      <m.path d={DOOR_RIGHT} variants={v.door} />
      <m.g variants={v.arrow}>
        <path d="M3.5 12 H14" />
        <path d="M10 8 L14 12 L10 16" />
      </m.g>
    </>
  ),
})
