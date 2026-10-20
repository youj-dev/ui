import { m } from 'motion/react'
import { after, createIcon, drawn, drawOut, origin } from './icon-base'

/* Arrow and pin share four cubic segments, vertex for vertex: tip ↔ pin
 * point, wings ↔ the pin's sides, notch ↔ the crown. The pin is stored
 * pre-rotated by −135° so the group's turn stands it upright. */
const ARROW = 'M20.5 3.5 C14.83 5.67 9.17 7.83 3.5 10 C6 11 8.5 12 11 13 C12 15.5 13 18 14 20.5 C16.17 14.83 18.33 9.17 20.5 3.5 Z'
const PIN = 'M17.66 6.34 C14.83 6.34 8.46 5.64 5.28 8.82 C2.55 11.55 2.55 15.98 5.28 18.72 C8.02 21.45 12.45 21.45 15.18 18.72 C18.36 15.54 17.66 9.17 17.66 6.34 Z'

/**
 * Navigating ↔ arrived. The heading arrow swings round to point down and
 * swells into a location pin, then its center is drawn in; setting off
 * again sharpens the pin back into the arrow. `active` = arrived.
 */
export const NavigationIcon = createIcon({
  name: 'navigation',
  category: 'location',
  keywords: ['directions', 'gps', 'heading', 'arrived', 'destination', 'route', 'location arrow'],
  states: ['navigating', 'arrived'],
  variants: (k) => ({
    marker: {
      rest: { d: ARROW, rotate: 0, transition: after(k, k.duration('instant'), 'slow', 'emphasized') },
      active: { d: PIN, rotate: 135, transition: k.tween('slow', 'emphasized') },
    },
    centre: { rest: drawOut(k, 'fast'), active: drawn(k, 'base', k.duration('slow')) },
  }),
  render: (v) => (
    <>
      <m.path d={ARROW} variants={v.marker} style={origin(12, 12)} />
      <m.circle cx="12" cy="9.5" r="3" variants={v.centre} />
    </>
  ),
})
