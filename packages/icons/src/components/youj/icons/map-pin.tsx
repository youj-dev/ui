import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const PIN = 'M12 20 C10 18 5 14 5 9.5 C5 5.63 8.13 2.5 12 2.5 C15.87 2.5 19 5.63 19 9.5 C19 14 14 18 12 20 Z'

/**
 * Pin ↔ dropped. The pin hops, drops onto its spot and lands with a squash
 * and a small settle; a ground ring spreads out beneath it and its center
 * fills. Lifting it clears the ring. `active` = dropped.
 */
export const MapPinIcon = createIcon({
  name: 'map-pin',
  category: 'location',
  keywords: ['location', 'place', 'marker', 'address', 'drop pin', 'destination', 'poi'],
  states: ['pin', 'dropped'],
  variants: (k) => {
    /* One timeline for the hop: up, fall, impact squash, rebound, settle. */
    const hop = [0, 0.3, 0.55, 0.66, 0.82, 1]
    const t = seq(k, 'deliberate', hop, ['standard', 'exit', 'exit', 'enter', 'standard'])
    const landing = k.duration('deliberate') * 0.55
    return {
      pin: {
        rest: { y: 0, scaleX: 1, scaleY: 1, transition: k.tween('base') },
        active: {
          y: [null, -1.75, 0, 0, 0, 0],
          scaleY: [null, 1.04, 1, 0.84, 1.04, 1],
          scaleX: [null, 0.97, 1, 1.08, 0.98, 1],
          transition: t,
        },
      },
      ring: {
        rest: { scale: 0.4, opacity: 0, transition: k.tween('fast', 'exit') },
        active: { scale: [0.4, 1], opacity: [0, 1], transition: { ...k.tween('slow', 'enter'), delay: landing } },
      },
      fill: {
        rest: { scale: 0, transition: k.tween('fast', 'exit') },
        active: { scale: 1, transition: { ...k.spring('settle'), delay: landing } },
      },
    }
  },
  render: (v, { id }) => (
    <>
      {/* The ring's far side passes behind the pin: the pin's silhouette, grown by a gap, is cut out of it above the point. */}
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d={PIN} fill="black" stroke="black" strokeWidth={4} variants={v.pin} style={origin(12, 20)} />
        <rect y="19.75" width="24" height="4.25" fill="white" stroke="none" />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <m.ellipse cx="12" cy="19.75" rx="6.5" ry="2" variants={v.ring} style={origin(12, 19.75)} />
      </g>
      <m.g variants={v.pin} style={origin(12, 20)}>
        <path d={PIN} />
        <circle cx="12" cy="9.5" r="3" />
        <m.circle cx="12" cy="9.5" r="3" fill="currentColor" variants={v.fill} style={origin(12, 9.5)} />
      </m.g>
    </>
  ),
})
