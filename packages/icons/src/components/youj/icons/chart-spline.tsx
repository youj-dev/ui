import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* One line through the same four points in both states, three cubics. Smooth,
 * the controls follow Catmull-Rom tangents; linear, they sit on the thirds
 * of each segment, so the curve pulls taut into straight runs. */
const SMOOTH = 'M6.5 15.5 C7.17 14.58 9.17 10.33 10.5 10 C11.83 9.67 13 14 14.5 13.5 C16 13 18.67 8.08 19.5 7'
const LINEAR = 'M6.5 15.5 C7.83 13.67 9.17 11.83 10.5 10 C11.83 11.17 13.17 12.33 14.5 13.5 C16.17 11.33 17.83 9.17 19.5 7'

/**
 * Smooth ↔ linear, for a chart's line style. The curve pulls taut through
 * its data points into straight segments; smoothing lets it relax back into
 * a spline. `active` = linear.
 */
export const ChartSplineIcon = createIcon({
  name: 'chart-spline',
  category: 'data',
  keywords: ['chart', 'line chart', 'spline', 'smooth', 'curve', 'trend', 'analytics', 'interpolation'],
  states: ['smooth', 'linear'],
  variants: (k) => ({
    line: {
      rest: { d: SMOOTH, transition: k.spring('smooth') },
      active: { d: LINEAR, transition: k.spring('snappy') },
    },
  }),
  render: (v) => (
    <>
      <path d="M3 3 V19 A2 2 0 0 0 5 21 H21" />
      <m.path d={SMOOTH} variants={v.line} />
    </>
  ),
})
