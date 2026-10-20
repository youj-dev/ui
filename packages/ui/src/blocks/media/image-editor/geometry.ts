/* The editor's geometry, in one place so the stage, the previews and the
 * saved file agree to the pixel.
 *
 * The image moves under a fixed frame. It's turned by `angle` (quarter turns
 * plus straightening), flipped, and scaled so that, at zoom 1, the turned
 * image just covers the frame: the frame's bounding box in the image's own
 * axes is W·|cos θ| + H·|sin θ| by W·|sin θ| + H·|cos θ|, and the cover scale
 * is the larger of that over the image's width and height. The frame's
 * center is kept in the image's own coordinates, so clamping it is one
 * rectangle: half the frame's extent (in source pixels) from each edge. A
 * point p of the source lands on screen (relative to the frame's center) at
 * pan + R(θ)·F·S·(p − c), where pan puts the chosen center at the frame's
 * center; everything else is that, inverted or composed. */

import type { ImageEditorEdit, ImageEditorPoint } from './data'

export interface Size {
  width: number
  height: number
}

/** Where the image sits: its center's offset from the frame's center (px), its scale (px per source px), angle and flips. */
export interface Placement {
  x: number
  y: number
  scale: number
  angle: number
  flipX: number
  flipY: number
}

const rad = (degrees: number) => (degrees * Math.PI) / 180
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Quarter turns and straightening, from a rotation: 92 → 1 quarter and 2°. */
export function splitRotation(rotation: number) {
  const quarters = Math.round(rotation / 90)
  return { quarter: ((quarters % 4) + 4) % 4, straighten: rotation - quarters * 90 }
}

/** The frame's width over height: the chosen ratio, or the image's own as turned. */
export function aspectOf(ratio: number | 'original', natural: Size, rotation: number) {
  if (ratio !== 'original') return ratio
  return splitRotation(rotation).quarter % 2 ? natural.height / natural.width : natural.width / natural.height
}

/** The largest frame of an aspect that fits a box. */
export function fitFrame(aspect: number, box: Size): Size {
  return box.width / box.height > aspect ? { width: box.height * aspect, height: box.height } : { width: box.width, height: box.width / aspect }
}

/** Half the frame's extent along the image's own axes, in screen px. */
function halfExtent(frame: Size, angle: number) {
  const c = Math.abs(Math.cos(rad(angle)))
  const s = Math.abs(Math.sin(rad(angle)))
  return { x: (frame.width * c + frame.height * s) / 2, y: (frame.width * s + frame.height * c) / 2 }
}

/** The scale at which the turned image just covers the frame. */
export function coverScale(frame: Size, natural: Size, angle: number) {
  const half = halfExtent(frame, angle)
  return Math.max((2 * half.x) / natural.width, (2 * half.y) / natural.height)
}

/** The frame's center, kept where the frame stays on the image; `give` lets it past an edge at a third of the pace (a drag). */
export function clampCenter(center: ImageEditorPoint, natural: Size, frame: Size, angle: number, scale: number, give = false): ImageEditorPoint {
  const half = halfExtent(frame, angle)
  const one = (value: number, length: number, extent: number) => {
    const lo = extent / scale / length
    const hi = 1 - lo
    if (lo >= hi) return 0.5
    if (!give) return clamp(value, lo, hi)
    return value < lo ? lo - (lo - value) / 3 : value > hi ? hi + (value - hi) / 3 : value
  }
  return { x: one(center.x, natural.width, half.x), y: one(center.y, natural.height, half.y) }
}

/** Where the image sits, from the frame's center in the image, the angle, the scale and the flips (1, −1, or between while one turns over). */
export function placement(center: ImageEditorPoint, angle: number, scale: number, flipX: number, flipY: number, natural: Size): Placement {
  const dx = (center.x - 0.5) * natural.width * flipX * scale
  const dy = (center.y - 0.5) * natural.height * flipY * scale
  const cos = Math.cos(rad(angle))
  const sin = Math.sin(rad(angle))
  return { x: -(dx * cos - dy * sin), y: -(dx * sin + dy * cos), scale, angle, flipX, flipY }
}

/** Where the image sits for an edit. */
export function place(edit: Pick<ImageEditorEdit, 'rotation' | 'flipX' | 'flipY' | 'zoom' | 'center'>, natural: Size, frame: Size): Placement {
  const scale = coverScale(frame, natural, edit.rotation) * Math.max(1, edit.zoom)
  return placement(edit.center, edit.rotation, scale, edit.flipX ? -1 : 1, edit.flipY ? -1 : 1, natural)
}

/** A point of the image on screen, relative to the frame's center. */
export function toFrame(point: ImageEditorPoint, natural: Size, p: Placement): ImageEditorPoint {
  const dx = (point.x - 0.5) * natural.width * p.flipX * p.scale
  const dy = (point.y - 0.5) * natural.height * p.flipY * p.scale
  const cos = Math.cos(rad(p.angle))
  const sin = Math.sin(rad(p.angle))
  return { x: p.x + dx * cos - dy * sin, y: p.y + dx * sin + dy * cos }
}

/** A screen offset from the frame's center, back in the image. */
export function toImage(q: ImageEditorPoint, natural: Size, p: Placement): ImageEditorPoint {
  const ux = q.x - p.x
  const uy = q.y - p.y
  const cos = Math.cos(rad(p.angle))
  const sin = Math.sin(rad(p.angle))
  return {
    x: 0.5 + ((ux * cos + uy * sin) * p.flipX) / p.scale / natural.width,
    y: 0.5 + ((-ux * sin + uy * cos) * p.flipY) / p.scale / natural.height,
  }
}

/** The CSS transform that puts the image (laid out at its natural size, centered) where a placement says. */
export const transformOf = (p: Placement, k = 1, offset: ImageEditorPoint = { x: 0, y: 0 }) =>
  `translate(-50%, -50%) translate(${k * (p.x - offset.x)}px, ${k * (p.y - offset.y)}px) rotate(${p.angle}deg) scale(${k * p.scale * p.flipX}, ${k * p.scale * p.flipY})`

/**
 * How a preview of another shape shows the framed image: scaled to cover the
 * preview, and moved so the focal point sits at its center as far as the
 * frame's edges allow (what an `object-position` from the focal point only
 * approximates). Returns the preview's scale and the frame offset it centers.
 */
export function previewView(frame: Size, box: Size, focal: ImageEditorPoint) {
  const k = Math.max(box.width / frame.width, box.height / frame.height)
  const half = { x: box.width / k / 2, y: box.height / k / 2 }
  return {
    k,
    offset: {
      x: clamp(focal.x, -frame.width / 2 + half.x, frame.width / 2 - half.x),
      y: clamp(focal.y, -frame.height / 2 + half.y, frame.height / 2 - half.y),
    },
  }
}

/** The output's size: the crop in source pixels, scaled down to fit `maxEdge`. */
export function outputSize(frame: Size, p: Placement, maxEdge: number): Size {
  const width = frame.width / p.scale
  const height = frame.height / p.scale
  const k = Math.min(1, maxEdge / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) }
}

/** Draws the framed image at its output size, as the stage shows it. */
export function render(image: CanvasImageSource, natural: Size, frame: Size, p: Placement, size: Size, opaque: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas unavailable')
  if (opaque) {
    // A JPEG has no transparency: what isn't image is white, not black.
    context.fillStyle = 'white'
    context.fillRect(0, 0, size.width, size.height)
  }
  context.imageSmoothingQuality = 'high'
  context.translate(size.width / 2, size.height / 2)
  context.scale(size.width / frame.width, size.height / frame.height)
  context.translate(p.x, p.y)
  context.rotate(rad(p.angle))
  context.scale(p.scale * p.flipX, p.scale * p.flipY)
  context.drawImage(image, -natural.width / 2, -natural.height / 2, natural.width, natural.height)
  return canvas
}
