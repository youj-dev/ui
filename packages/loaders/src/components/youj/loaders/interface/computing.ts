import { clamp, point, type Depth, type Project, type Tone } from '../field'

/* Scratch points belong to the drawing, never to a frame. Depth copies each
 * mark, so every scene can reuse these for its projected rules and windows. */
const a = point(), b = point()
const corners = Array.from({ length: 4 }, point)
const xy: number[] = []

export function rule(depth: Depth, project: Project, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, hair: number, alpha: number, tone: Tone = 'ink', order?: number) {
  project(x0, y0, z0, a)
  project(x1, y1, z1, b)
  const near = clamp(0.86 + (a.z + b.z) / 360, 0.55, 1)
  const width = hair * Math.min(1.18, (a.k + b.k) / 2)
  if (order === undefined) depth.line(a, b, width, alpha * near, tone)
  else depth.path([a.x, a.y, b.x, b.y], order, { width, alpha: alpha * near, tone })
}

/** An opaque paper window in the XY plane; its rules keep their true depth. */
export function window(depth: Depth, project: Project, x: number, y: number, z: number, w: number, h: number, hair: number, alpha: number, fill = 0, tone: Tone = 'ink') {
  project(x - w / 2, y - h / 2, z, corners[0]!)
  project(x + w / 2, y - h / 2, z, corners[1]!)
  project(x + w / 2, y + h / 2, z, corners[2]!)
  project(x - w / 2, y + h / 2, z, corners[3]!)
  xy.length = 0
  let order = 0
  for (const p of corners) { xy.push(p.x, p.y); order += p.z / 4 }
  if (fill >= 0) depth.poly(xy, order, fill, 'ink', true)
  depth.path(xy, order + 0.02, { width: hair, alpha, tone, closed: true })
  return order
}
