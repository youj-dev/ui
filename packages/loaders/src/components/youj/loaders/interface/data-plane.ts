import { Depth, point, type Project, type Tone } from '../field'

const corners = Array.from({ length: 4 }, point)
const xy: number[] = []

/** A shallow data card: a lit face, a near edge, and an opaque paper backing. */
export function dataPlane(depth: Depth, project: Project, x: number, y: number, z: number, w: number, h: number, hair: number, light: number, alpha = 0.8, tone: Tone = 'ink') {
  project(x - w / 2, y - h / 2, z, corners[0]!)
  project(x + w / 2, y - h / 2, z, corners[1]!)
  project(x + w / 2, y + h / 2, z, corners[2]!)
  project(x - w / 2, y + h / 2, z, corners[3]!)
  xy.length = 0
  let order = 0
  for (const p of corners) { xy.push(p.x, p.y); order += p.z / 4 }
  depth.face(xy, order, light)
  depth.path(xy, order + 0.02, { width: hair, alpha, closed: true })
  depth.path(xy.slice(0, 4), order + 0.03, { width: hair * 1.25, alpha, tone })
  return order
}
