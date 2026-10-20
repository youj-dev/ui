import { m } from 'motion/react'
import { createIcon, origin, seq, type IconVariants } from './icon-base'

/* A reticle: a 6.5-unit ring with four 5-unit ticks that cross it, half
 * outside and half in, stopping 4 units short of the center, where the lock
 * dot lands. */
const TICKS = [
  { d: 'M12 3 V8', dx: 0, dy: 1 },
  { d: 'M21 12 H16', dx: -1, dy: 0 },
  { d: 'M12 21 V16', dx: 0, dy: -1 },
  { d: 'M3 12 H8', dx: 1, dy: 0 },
]

/**
 * Locate ↔ locked. The ticks close in and the ring tightens as it acquires,
 * then everything springs back open as the center locks on with a settle.
 * `active` = locked.
 */
export const CrosshairIcon = createIcon({
  name: 'crosshair',
  category: 'location',
  keywords: ['locate', 'my location', 'target', 'gps', 'focus', 'precision', 'aim', 'reticle', 'locate-fixed'],
  states: ['locate', 'locked'],
  variants: (k): IconVariants => {
    const squeeze = seq(k, 'slow', [0, 0.45, 1], ['exit', 'emphasized'])
    const tick = (dx: number, dy: number) => ({
      rest: { x: 0, y: 0, transition: k.tween('fast') },
      active: { x: [null, dx * 1.5, 0], y: [null, dy * 1.5, 0], transition: squeeze },
    })
    return {
      ...Object.fromEntries(TICKS.map((t, i) => [`t${i}`, tick(t.dx, t.dy)])),
      ring: {
        rest: { scale: 1, transition: k.tween('fast') },
        active: { scale: [null, 0.86, 1], transition: squeeze },
      },
      dot: {
        rest: { scale: 0, transition: k.tween('fast', 'exit') },
        active: { scale: 1, transition: { ...k.spring('settle'), delay: k.duration('slow') * 0.45 } },
      },
    }
  },
  render: (v) => (
    <>
      <m.circle cx="12" cy="12" r="6.5" variants={v.ring} style={origin(12, 12)} />
      {TICKS.map((t, i) => (
        <m.path key={t.d} d={t.d} variants={v[`t${i}`]} />
      ))}
      <m.circle cx="12" cy="12" r="2" fill="currentColor" variants={v.dot} style={origin(12, 12)} />
    </>
  ),
})
