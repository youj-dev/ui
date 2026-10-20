import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* A tall peak and a lower shoulder on one ridge, closed along the ground.
 * The sun rises behind the shoulder: the mask cuts the mountain (with a
 * margin) out of it, so it clears the ridge rather than crossing it. */
const RIDGE = 'M3 18.5 L8.5 6.5 L12 14 L15.25 10 L21 18.5 Z'

/**
 * Landscape, terrain, the outdoors. A sun rises from behind the lower peak
 * and holds there while hovered; leaving sets it behind the ridge again.
 */
export const MountainIcon = createIcon({
  name: 'mountain',
  category: 'location',
  keywords: ['mountain', 'landscape', 'terrain', 'outdoors', 'hike', 'peak', 'summit', 'nature', 'trail'],
  variants: (k) => ({
    sun: {
      rest: {
        y: 11,
        opacity: 0,
        transition: { y: k.tween('base', 'exit'), opacity: { ...k.tween('instant', 'linear'), delay: k.duration('base') - k.duration('instant') } },
      },
      active: { y: 0, opacity: 1, transition: { y: k.tween('slow', 'emphasized'), opacity: k.tween('instant', 'linear') } },
    },
  }),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <path d={RIDGE} fill="black" stroke="black" strokeWidth={4} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <m.circle cx="18" cy="5" r="2" variants={v.sun} />
      </g>
      <path d={RIDGE} />
    </>
  ),
})
