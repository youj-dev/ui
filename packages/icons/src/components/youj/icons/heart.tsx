import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const HEART = 'M12 19.01 L5.24 12.26 A4.25 4.25 0 1 1 12 7.25 A4.25 4.25 0 1 1 18.76 12.26 Z'
/** Burst particles: angle in degrees, placed just outside the heart. */
const PARTICLES = [-90, -30, 30, 150, 210]

/**
 * Like. The heart squeezes, pops past full size and settles (the one place a
 * bounce is earned), fills, and throws a ring of particles. `active` = liked.
 */
export const HeartIcon = createIcon({
  name: 'heart',
  category: 'status',
  keywords: ['like', 'love', 'favorite', 'favourite', 'save'],
  states: ['unliked', 'liked'],
  variants: (k) => {
    const burst = (i: number) => ({
      rest: { scale: 0, opacity: 0, transition: k.tween('fast') },
      active: {
        scale: [0, 1, 0.4],
        opacity: [0, 1, 0],
        transition: seq(k, 'slow', [0, 0.35, 1], ['enter', 'exit'], k.duration('fast') + i * k.stagger('tight') * 0.5),
      },
    })
    return {
      heart: {
        rest: { scale: 1, transition: k.tween('base') },
        active: {
          scale: [1, 0.82, 1.14, 1],
          transition: seq(k, 'deliberate', [0, 0.22, 0.55, 1], ['standard', 'enter', 'emphasized']),
        },
      },
      fill: {
        rest: { opacity: 0, transition: k.tween('base') },
        active: { opacity: [0, 0, 1, 1], transition: seq(k, 'deliberate', [0, 0.22, 0.45, 1], ['linear', 'enter', 'linear']) },
      },
      p0: burst(0),
      p1: burst(1),
      p2: burst(2),
      p3: burst(3),
      p4: burst(4),
    }
  },
  render: (v) => (
    <>
      <m.g variants={v.heart} style={origin(12, 12.5)}>
        <m.path d={HEART} fill="currentColor" stroke="none" variants={v.fill} />
        <path d={HEART} />
      </m.g>
      {PARTICLES.map((deg, i) => {
        const a = (deg * Math.PI) / 180
        const x = 12 + 9.5 * Math.cos(a)
        const y = 12.5 + 9.5 * Math.sin(a)
        return (
          <m.g key={deg} variants={v[`p${i}` as 'p0']} style={origin(x, y)}>
            <path d={`M${x} ${y} h.01`} strokeWidth={2} />
          </m.g>
        )
      })}
    </>
  ),
})
