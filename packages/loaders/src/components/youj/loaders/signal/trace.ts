import { clamp, type View } from '../field'

/* What the signal loaders share: the level of detail and the line widths
 * they draw with at a size. */

/** 0 below 32px, 1 up to 80px, 2 above: fewer, larger marks when small. */
export const detail = (view: View) => (view.size < 32 ? 0 : view.size < 80 ? 1 : 2)

/** Widths in units: a CSS hairline, the signal's own line, and the side of the accent head that writes it. */
export function pens(view: View) {
  return {
    hair: 1 / view.px,
    line: clamp(view.size * 0.026, 1.25, 2.1) / view.px,
    head: clamp(view.size * 0.075, 3, 6.5) / view.px,
  }
}
