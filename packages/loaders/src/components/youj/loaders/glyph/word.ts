import { TITTLE, WORDMARK, WORDMARK_BOX, flatten } from '../glyphs'

/* The wordmark's outlines, flattened once, for the glyph loaders: each
 * outline as points on the wordmark's 24-unit grid, with the letter it
 * belongs to, and the boxes and lines a type designer draws it on. */

export interface Contour {
  /** Its letter's index in the word: y 0, o 1, u 2, j 3. */
  letter: number
  pts: [number, number][]
}

export const CONTOURS: Contour[] = WORDMARK.flatMap((l, letter) => l.outlines.map((d) => ({ letter, pts: flatten(d, 10) })))

/** Each letter's box on the grid. */
export const LETTER_BOXES = WORDMARK.map((_, letter) => {
  const pts = CONTOURS.filter((c) => c.letter === letter).flatMap((c) => c.pts)
  const xs = pts.map(([x]) => x)
  const ys = pts.map(([, y]) => y)
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
})

/** The vertical metrics, top to bottom: ascender, x-height, baseline, descender. */
export const METRICS = [4, 8.57, 20, 24]

export { TITTLE }

/** The word's center on the grid. */
export const CENTER = { x: WORDMARK_BOX.x + WORDMARK_BOX.w / 2, y: WORDMARK_BOX.y + WORDMARK_BOX.h / 2 }

/** A grid point in world units: centered on the word, y up, `scale` world units per grid unit. */
export const world = (x: number, y: number, scale: number): [number, number, number] => [(x - CENTER.x) * scale, -(y - CENTER.y) * scale, 0]
