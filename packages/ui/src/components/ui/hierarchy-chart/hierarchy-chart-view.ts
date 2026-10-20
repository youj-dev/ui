/* The chart's camera: a translation and a scale over the laid-out world. The
 * content may sit anywhere in world space (a toggled branch keeps its place by
 * shifting the rest), so the helpers take the content's rectangle. */

export interface View {
  x: number
  y: number
  k: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export const PAD = 24
/** The strip along the canvas's foot kept for the zoom controls. */
export const BAND = 44
export const MIN_ZOOM = 0.2
export const MAX_ZOOM = 2
export const ZOOM_STEP = 1.25
/** The least the chart opens at, so names stay legible; a bigger chart opens at its root and pans. */
export const OPEN_FLOOR = 0.6

export const clampZoom = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k))

/** An axis that fits stays centered; one that overflows pans only as far as its edges. */
function axis(pos: number, view: number, start: number, size: number, k: number) {
  const s = pos + start * k
  const fitted = size * k + PAD * 2 <= view ? (view - size * k) / 2 : Math.min(PAD, Math.max(view - size * k - PAD, s))
  return fitted - start * k
}

export const clampView = (v: View, vw: number, vh: number, c: Rect): View => ({
  k: v.k,
  x: axis(v.x, vw, c.x, c.w, v.k),
  y: axis(v.y, vh - BAND, c.y, c.h, v.k),
})

/** The whole content in view, no larger than life and no smaller than `floor`; past the floor, `focus` (the root) is kept in view. */
export function fitView(vw: number, vh: number, c: Rect, floor: number, focus?: { x: number; y: number }): View {
  const room = vh - BAND
  const k = clampZoom(Math.max(floor, Math.min((vw - PAD * 2) / Math.max(1, c.w), (room - PAD * 2) / Math.max(1, c.h), 1)))
  const centered = { k, x: vw / 2 - (c.x + c.w / 2) * k, y: room / 2 - (c.y + c.h / 2) * k }
  if (focus) {
    if (c.w * k + PAD * 2 > vw) centered.x = vw / 2 - focus.x * k
    if (c.h * k + PAD * 2 > room) centered.y = room / 2 - focus.y * k
  }
  return clampView(centered, vw, vh, c)
}

export const zoomAt = (v: View, k: number, px: number, py: number): View => {
  const next = clampZoom(k)
  return { k: next, x: px - ((px - v.x) / v.k) * next, y: py - ((py - v.y) / v.k) * next }
}
