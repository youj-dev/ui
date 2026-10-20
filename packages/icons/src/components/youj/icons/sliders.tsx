import { m } from 'motion/react'
import { createIcon, type IconVariants } from './icon-base'

/* Each track is one line with a gap cut around its knob by a mask, so the
 * gap travels with the knob instead of the track being redrawn. */
const KNOBS = [
  { y: 6, x: 15, to: 8.5 },
  { y: 12, x: 8, to: 15.5 },
  { y: 18, x: 13, to: 9.5 },
]

/** Tuning: the three knobs glide to new values, each a beat after the last, and hold there while hovered; release slides them home. */
export const SlidersIcon = createIcon({
  name: 'sliders',
  category: 'system',
  keywords: ['adjust', 'settings', 'controls', 'filters', 'mixer', 'preferences', 'equalizer'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      KNOBS.map(({ x, to }, i) => [
        `k${i}`,
        {
          rest: { x: 0, transition: { ...k.spring('smooth'), delay: (KNOBS.length - 1 - i) * k.stagger('base') } },
          active: { x: to - x, transition: { ...k.spring('smooth'), delay: i * k.stagger('base') } },
        },
      ]),
    ),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        {KNOBS.map(({ x, y }, i) => (
          <m.circle key={y} cx={x} cy={y} r="3.5" fill="black" stroke="none" variants={v[`k${i}`]} />
        ))}
      </mask>
      <path d="M3 6 H21 M3 12 H21 M3 18 H21" mask={`url(#${id}-m)`} />
      {KNOBS.map(({ x, y }, i) => (
        <m.circle key={y} cx={x} cy={y} r="2" variants={v[`k${i}`]} />
      ))}
    </>
  ),
})
