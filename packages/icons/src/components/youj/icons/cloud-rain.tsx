import { m } from 'motion/react'
import { createIcon, seq, type IconVariants } from './icon-base'

/* The set's cloud silhouette (the three circles of `cloud`) at 95%, lifted to leave room for rain. */
const CLOUD = 'M6.8 14 A2.85 2.85 0 0 1 6.55 8.31 A4.75 4.75 0 1 1 15.8 6.43 A3.8 3.8 0 1 1 16.3 14 Z'
/* Drops, and the order they fall in (in stagger steps). */
const DROPS = [
  { d: 'M8 16 V18.5', step: 0 },
  { d: 'M12 18.5 V21', step: 1.6 },
  { d: 'M16 16 V18.5', step: 0.8 },
]

/** Rain: each drop falls out of view and the next one slides down out of the cloud, in a loose, uneven cadence. */
export const CloudRainIcon = createIcon({
  name: 'cloud-rain',
  category: 'weather',
  keywords: ['rain', 'weather', 'forecast', 'shower', 'drizzle', 'wet'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      DROPS.map(({ step }, i) => [
        `d${i}`,
        {
          rest: { y: 0, opacity: 1, transition: k.tween('fast') },
          active: {
            y: [null, 5, -8, 0],
            opacity: [null, 0, 1, 1],
            transition: seq(k, 'deliberate', [0, 0.38, 0.39, 1], ['exit', 'linear', 'emphasized'], step * k.stagger('loose')),
          },
        },
      ]),
    ),
  render: (v, { id }) => (
    <>
      <path d={CLOUD} />
      {/* Drops only exist below the cloud: they emerge from its underside. */}
      <clipPath id={`${id}-c`}>
        <rect y="14.75" width="24" height="9.25" />
      </clipPath>
      <g clipPath={`url(#${id}-c)`}>
        {DROPS.map(({ d }, i) => (
          <m.path key={d} d={d} variants={v[`d${i}`]} />
        ))}
      </g>
    </>
  ),
})
