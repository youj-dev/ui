import { m } from 'motion/react'
import { createIcon, after } from './icon-base'

/* Monitor and phone are the same rounded rectangle, so the screen morphs
 * point for point. The stand folds into the phone's home bar: the neck
 * shrinks into the bar's center while the foot narrows and rises into it. */
const screen = (x0: number, y0: number, x1: number, y1: number) =>
  `M${x0 + 2} ${y0} H${x1 - 2} A2 2 0 0 1 ${x1} ${y0 + 2} V${y1 - 2} A2 2 0 0 1 ${x1 - 2} ${y1} H${x0 + 2} A2 2 0 0 1 ${x0} ${y1 - 2} V${y0 + 2} A2 2 0 0 1 ${x0 + 2} ${y0} Z`
const DESKTOP = screen(3, 3.5, 21, 15.5)
const MOBILE = screen(7, 2.5, 17, 21.5)

/**
 * Desktop ↔ mobile. The stand folds up into a home bar and the screen draws
 * itself narrow and tall into a phone; going back, the screen widens first
 * and the stand drops out beneath it. `active` = mobile.
 */
export const ResponsiveIcon = createIcon({
  name: 'responsive',
  category: 'devices',
  keywords: ['viewport', 'breakpoint', 'desktop', 'mobile', 'preview', 'device', 'layout'],
  states: ['desktop', 'mobile'],
  variants: (k) => {
    const lag = k.duration('fast')
    return {
      screen: {
        rest: { d: DESKTOP, transition: k.tween('slow', 'emphasized') },
        active: { d: MOBILE, transition: after(k, lag * 0.6, 'slow', 'emphasized') },
      },
      neck: {
        rest: { d: 'M12 15.5 V20.5', transition: after(k, lag * 1.5, 'base', 'emphasized') },
        active: { d: 'M12 18.5 V18.5', transition: k.tween('base', 'emphasized') },
      },
      foot: {
        rest: { d: 'M8 20.5 H16', transition: after(k, lag * 1.5, 'base', 'emphasized') },
        active: { d: 'M10.5 18.5 H13.5', transition: k.tween('base', 'emphasized') },
      },
    }
  },
  render: (v) => (
    <>
      <m.path d={DESKTOP} variants={v.screen} />
      <m.path d="M12 15.5 V20.5" variants={v.neck} />
      <m.path d="M8 20.5 H16" variants={v.foot} />
    </>
  ),
})
