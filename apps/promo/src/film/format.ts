import { useVideoConfig } from 'remotion'

/* The stages, in CSS px, and the scale they render at. A 1440 × 810 stage at
 * 4/3 is a 1920 × 1080 frame: the UI at the size a laptop shows it (a
 * 1440-wide Retina screen, captured and scaled to 1080p), not blown up. The
 * square cut is the same density on 810 × 810 (1080 × 1080). The homepage
 * loop plays at about 1100px wide, so it lays out on 1200 × 675 at 1.6: the
 * same apps, a size larger, still readable there.
 *
 * The topic loops use the film's wide stage, plus two cuts of their own: a
 * 4:5 portrait (864 × 1080 at 1.25 is 1080 × 1350) and a strip for the
 * homepage's pillar tiles (1120 × 448 at 1). The tiles are 224px tall and
 * 273 to 559px wide, so the strip is 2.5:1 and keeps what matters in its
 * middle 1.22:1, the narrowest tile. Every stage is at least 864px wide, so
 * the apps inside lay out at their desktop breakpoints: media queries answer
 * to the stage, not to the window a scene draws them in. */

export const STAGES = {
  wide: { width: 1440, height: 810, scale: 4 / 3 },
  square: { width: 810, height: 810, scale: 4 / 3 },
  loop: { width: 1200, height: 675, scale: 1.6 },
  tall: { width: 864, height: 1080, scale: 1.25 },
  tile: { width: 1120, height: 448, scale: 1 },
} as const

/** The part of the tile strip every tile shows, however narrow: its middle, at the narrowest tile's 273 × 224. */
export const TILE_SAFE = { width: Math.round((STAGES.tile.height * 273) / 224), height: STAGES.tile.height }

export interface Format {
  width: number
  height: number
  square: boolean
  /** The homepage loop: no captions, the product alone. */
  loop: boolean
  /** The topic loops' 4:5 cut. */
  tall: boolean
  /** The topic loops' strip for the pillar tiles. */
  tile: boolean
}

const is = (stage: { width: number; height: number }, width: number, height: number) => width === stage.width && height === stage.height

/** The stage the scene is laid out on. */
export function useFormat(): Format {
  const { width, height } = useVideoConfig()
  return {
    width,
    height,
    square: width === height,
    loop: is(STAGES.loop, width, height),
    tall: is(STAGES.tall, width, height),
    tile: is(STAGES.tile, width, height),
  }
}
