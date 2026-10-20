import { m } from 'motion/react'
import { createIcon, origin, seq, type IconVariants } from './icon-base'

/* A tower with a lower wing on its right. Windows are solid dots, grouped
 * by floor from the ground up so the lights come on floor by floor. */
const FLOORS: [number, number][][] = [
  [
    [8, 14],
    [12, 14],
    [17.5, 15.5],
  ],
  [
    [8, 10.5],
    [12, 10.5],
    [17.5, 12],
  ],
  [
    [8, 7],
    [12, 7],
  ],
]

/** Office. The windows switch off and flicker back on, floor by floor from the ground up. */
export const BuildingIcon = createIcon({
  name: 'building',
  category: 'commerce',
  keywords: ['company', 'office', 'organization', 'workspace', 'business', 'headquarters', 'city', 'building-2', 'enterprise'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      FLOORS.map((_, floor) => [
        `f${floor}`,
        {
          rest: { scale: 1, opacity: 1, transition: k.tween('fast') },
          active: {
            scale: [null, 0.4, 1.45, 1],
            opacity: [null, 0.3, 1, 1],
            transition: seq(k, 'slow', [0, 0.3, 0.62, 1], ['exit', 'enter', 'standard'], floor * k.stagger('loose')),
          },
        },
      ]),
    ),
  render: (v) => (
    <>
      <path d="M5 21 V4.5 A1.5 1.5 0 0 1 6.5 3 H13.5 A1.5 1.5 0 0 1 15 4.5 V21" />
      <path d="M15 9 H18.5 A1.5 1.5 0 0 1 20 10.5 V21" />
      <path d="M3 21 H21" />
      <path d="M8.75 21 V18.5 A1 1 0 0 1 9.75 17.5 H10.25 A1 1 0 0 1 11.25 18.5 V21" />
      {FLOORS.map((windows, floor) =>
        windows.map(([x, y]) => (
          <m.circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="currentColor" stroke="none" variants={v[`f${floor}`]} style={origin(x, y)} />
        )),
      )}
    </>
  ),
})
