import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* The picture is inset from the frame and cut along an arc concentric with
 * the waves, so it never touches them. */
const PICTURE = 'M12.68 17 H17.5 A1 1 0 0 0 18.5 16 V8 A1 1 0 0 0 17.5 7 H6.5 A1 1 0 0 0 5.5 8 V9.82 A10 10 0 0 1 12.68 17 Z'
const ARCS = ['M3 15.5 A4 4 0 0 1 7 19.5', 'M3 11.5 A8 8 0 0 1 11 19.5']

/**
 * Idle ↔ casting. A pulse leaves the corner, the waves light up one after
 * another, and the picture spreads across the screen from where they land.
 * `active` = casting.
 */
export const CastIcon = createIcon({
  name: 'cast',
  category: 'devices',
  keywords: ['chromecast', 'airplay', 'screen', 'tv', 'mirror', 'stream', 'device'],
  states: ['idle', 'casting'],
  variants: (k) => {
    const s = k.stagger('loose')
    const wave = (i: number) => ({
      rest: { opacity: 1, transition: k.tween('fast') },
      active: { opacity: [null, 0.2, 1], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'enter'], (i + 1) * s) },
    })
    return {
      source: {
        rest: { scale: 1, transition: k.tween('fast') },
        active: { scale: [null, 1.7, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
      },
      w0: wave(0),
      w1: wave(1),
      picture: {
        rest: { clipPath: 'circle(0% at 0% 100%)', transition: k.tween('base', 'exit') },
        active: { clipPath: 'circle(142% at 0% 100%)', transition: { ...k.tween('slow', 'emphasized'), delay: s * 3 } },
      },
    }
  },
  render: (v) => (
    <>
      <path d="M3 8.5 V6.5 A2 2 0 0 1 5 4.5 H19 A2 2 0 0 1 21 6.5 V17.5 A2 2 0 0 1 19 19.5 H13.5" />
      {ARCS.map((d, i) => (
        <m.path key={d} d={d} variants={v[`w${i}` as 'w0']} />
      ))}
      <m.path d="M3 19.5 h.01" strokeWidth={2.25} variants={v.source} style={origin(3, 19.5)} />
      <m.path d={PICTURE} fill="currentColor" stroke="none" variants={v.picture} />
    </>
  ),
})
