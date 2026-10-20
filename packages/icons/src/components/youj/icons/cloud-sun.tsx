import { m } from 'motion/react'
import { after, createIcon, drawn, drawOut, type IconVariants } from './icon-base'

/* Both clouds are the set's cloud silhouette (the three circles of `cloud`),
 * at 80% beside the sun and 95% up top. They share one command structure
 * (three arcs, same flags), so the small cloud swells point for point into
 * the rain cloud, which is exactly cloud-rain's. */
const CLOUD_SUN = 'M9.8 18.75 A2.4 2.4 0 0 1 9.59 13.96 A4 4 0 1 1 17.38 12.38 A3.2 3.2 0 1 1 17.8 18.75 Z'
const CLOUD_RAIN = 'M6.8 14 A2.85 2.85 0 0 1 6.55 8.31 A4.75 4.75 0 1 1 15.8 6.43 A3.8 3.8 0 1 1 16.3 14 Z'
/* Rays on the open side of the sun only; the cloud covers the rest. Inner end first, so they draw outward. */
const RAYS = [-90, -135, 180, -45, 135].map((deg) => {
  const a = (deg * Math.PI) / 180
  const p = (r: number) => `${+(8.5 + r * Math.cos(a)).toFixed(2)} ${+(9 + r * Math.sin(a)).toFixed(2)}`
  return `M${p(4.75)} L${p(6.25)}`
})
const DROPS = ['M8 16 V18.5', 'M12 18.5 V21', 'M16 16 V18.5']

/**
 * Sun ↔ rain. The rays pull in, the cloud swells and drifts over the sun
 * until it's gone, then rain starts to fall from it; clearing up plays it
 * back, drops first. `active` = rain.
 */
export const CloudSunIcon = createIcon({
  name: 'cloud-sun',
  category: 'weather',
  keywords: ['weather', 'partly cloudy', 'forecast', 'sun', 'rain', 'change', 'overcast'],
  states: ['sun', 'rain'],
  variants: (k): IconVariants => {
    const s = k.stagger('tight')
    const beat = k.duration('fast')
    const move = k.duration('slow')
    const rays = Object.fromEntries(
      RAYS.map((_, i) => [
        `r${i}`,
        {
          rest: drawn(k, 'base', beat + move * 0.7 + i * s),
          active: drawOut(k, 'fast', i * s),
        },
      ]),
    )
    const drops = Object.fromEntries(
      DROPS.map((_, i) => [
        `d${i}`,
        {
          /* Clearing: drops fall out as they fade, and wait there unseen. Rain relaunches them from inside the cloud. */
          rest: { y: 5, opacity: 0, transition: { y: after(k, i * s, 'base', 'exit'), opacity: after(k, i * s, 'fast', 'enter') } },
          active: {
            y: [-8, 0],
            opacity: 1,
            transition: { y: after(k, beat + move * 0.8 + [0, 2, 1][i]! * k.stagger('base'), 'slow', 'emphasized'), opacity: k.tween('instant') },
          },
        },
      ]),
    )
    return {
      ...rays,
      ...drops,
      cloud: {
        rest: { d: CLOUD_SUN, transition: after(k, beat, 'slow', 'emphasized') },
        active: { d: CLOUD_RAIN, transition: after(k, beat, 'slow', 'emphasized') },
      },
      sun: {
        rest: { x: 0, y: 0, opacity: 1, transition: after(k, beat, 'slow', 'emphasized') },
        active: {
          x: 2.5,
          y: 1.5,
          opacity: 0,
          transition: { default: after(k, beat, 'slow', 'emphasized'), opacity: after(k, beat + move * 0.6, 'fast') },
        },
      },
    }
  },
  render: (v, { id }) => (
    <>
      {/* The sun sits behind the cloud: the cloud's shape, grown by a gap, is cut out of it. */}
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d={CLOUD_SUN} fill="black" stroke="black" strokeWidth={3.5} variants={v.cloud} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <m.g variants={v.sun}>
          <circle cx="8.5" cy="9" r="3" />
          {RAYS.map((d, i) => (
            <m.path key={d} d={d} variants={v[`r${i}`]} />
          ))}
        </m.g>
      </g>
      <m.path d={CLOUD_SUN} variants={v.cloud} />
      <clipPath id={`${id}-c`}>
        <rect y="14.75" width="24" height="9.25" />
      </clipPath>
      <g clipPath={`url(#${id}-c)`}>
        {DROPS.map((d, i) => (
          <m.path key={d} d={d} variants={v[`d${i}`]} />
        ))}
      </g>
    </>
  ),
})
