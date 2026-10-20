import { cubicBezier, m } from 'motion/react'
import { createIcon, seq, type IconVariants } from './icon-base'

/* A meridian at longitude λ projects to a half-ellipse from pole to pole
 * with signed half-width 9·sin λ (two cubics, so the width can cross zero).
 * The resting lens is ±4 wide; a turn advances every meridian by the
 * spacing between those two, so the end frame matches the start frame. */
const K = 0.5523
const meridian = (w: number) =>
  `M12 3 C${12 + K * w} 3 ${12 + w} ${12 - K * 9} ${12 + w} 12 C${12 + w} ${12 + K * 9} ${12 + K * w} 21 12 21`
const LON = Math.asin(4 / 9)
const STEP = 2 * LON
const SAMPLES = 8
/* Where each meridian starts its turn. */
const TRACKS = [-LON - STEP, -LON, LON]
/* Meridians fade out as they roll onto the rim, between 55° and 79°. */
const visible = (lon: number) => Math.min(1, Math.max(0, (1.379 - Math.abs(lon)) / 0.419))

/**
 * The globe turns on its axis: the meridians roll one step east and fade as
 * they reach the rim. Rest is the end of the turn, so leaving mid-turn
 * finishes it forwards.
 */
export const GlobeIcon = createIcon({
  name: 'globe',
  category: 'location',
  keywords: ['world', 'earth', 'language', 'international', 'web', 'region', 'public'],
  variants: (k): IconVariants => {
    /* The ease is applied to longitude, then sampled, so the projection stays true at every frame. */
    const ease = cubicBezier(...k.ease('emphasized'))
    const times = Array.from({ length: SAMPLES + 1 }, (_, i) => i / SAMPLES)
    const track = (from: number) => {
      const lons = times.map((t) => from + STEP * ease(t))
      const end = from + STEP
      return {
        rest: { d: meridian(9 * Math.sin(end)), opacity: visible(end), transition: k.tween('base', 'enter') },
        active: {
          d: lons.map((l) => meridian(9 * Math.sin(l))),
          opacity: lons.map(visible),
          transition: seq(k, 'deliberate', times, times.slice(1).map(() => 'linear' as const)),
        },
      }
    }
    return Object.fromEntries(TRACKS.map((from, i) => [`m${i}`, track(from)]))
  },
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12 H21" />
      {TRACKS.map((from, i) => (
        <m.path key={i} d={meridian(9 * Math.sin(from + STEP))} variants={v[`m${i}`]} />
      ))}
    </>
  ),
})
