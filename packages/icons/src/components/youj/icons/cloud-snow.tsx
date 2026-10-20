import { m } from 'motion/react'
import { createIcon, seq, type IconVariants } from './icon-base'

/* cloud-rain's cloud, with flakes where its drops fall. */
const CLOUD = 'M6.8 14 A2.85 2.85 0 0 1 6.55 8.31 A4.75 4.75 0 1 1 15.8 6.43 A3.8 3.8 0 1 1 16.3 14 Z'
const FLAKES = [
  { x: 8, y: 17, sway: 0.75 },
  { x: 12, y: 19.5, sway: -0.75 },
  { x: 16, y: 17, sway: 0.75 },
]

/** Snowing: the flakes drift down out of the cloud, swaying as they fall, and new ones form beneath it. */
export const CloudSnowIcon = createIcon({
  name: 'cloud-snow',
  category: 'weather',
  keywords: ['snow', 'winter', 'weather', 'cold', 'forecast', 'flurries', 'frost'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      FLAKES.map(({ sway }, i) => [
        `f${i}`,
        {
          rest: { x: 0, y: 0, opacity: 1, transition: k.tween('fast') },
          active: {
            x: [null, sway, sway, 0],
            y: [null, 2.5, -2, 0],
            opacity: [null, 0, 0, 1],
            transition: seq(k, 'deliberate', [0, 0.5, 0.55, 1], ['standard', 'linear', 'enter'], i * k.stagger('loose')),
          },
        },
      ]),
    ),
  render: (v, { id }) => (
    <>
      <path d={CLOUD} />
      <clipPath id={`${id}-c`}>
        <rect y="14.75" width="24" height="9.25" />
      </clipPath>
      <g clipPath={`url(#${id}-c)`}>
        {FLAKES.map(({ x, y }, i) => (
          <m.path key={x} d={`M${x} ${y} h.01`} strokeWidth={2.25} variants={v[`f${i}`]} />
        ))}
      </g>
    </>
  ),
})
