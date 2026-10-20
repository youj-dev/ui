/* Reusable spherical topology, built once at three resolutions. Scenes own
 * their choreography; this helper only projects and shades their surfaces. */
import { TAU, clamp, lambert, point, type Depth, type Project, type Tone, type View } from '../field'

export type V3 = [number, number, number]
export type Turn = (x: number, y: number, z: number) => V3
export const lod = (view: View) => view.size < 32 ? 0 : view.size < 80 ? 1 : 2
export const hairline = (view: View) => (view.size < 32 ? 1 : 1.05) / view.px
export const near = (z: number, radius = 32) => clamp(0.48 + z / (radius * 2.2), 0.12, 0.94)
export const circles = [24, 36, 48].map(n => Array.from({ length: n + 1 }, (_, i) => [Math.cos(TAU * i / n), Math.sin(TAU * i / n)] as const))
export const grids = [[6, 12], [9, 18], [12, 24]].map(([rows, cols]) => {
  const unit: V3[] = []
  const faces: number[][] = []
  for (let j = 0;j <= rows!;j++) {
    const lat = -Math.PI / 2 + Math.PI * j / rows!
    for (let i = 0;i <= cols!;i++) {
      const lon = TAU * i / cols!
      unit.push([Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)])
    }
  }
  for (let j = 0;j < rows!;j++) for (let i = 0;i < cols!;i++) {
    const a = j * (cols! + 1) + i
    faces.push([a, a + cols! + 1, a + cols! + 2, a + 1])
  }
  return { unit, faces, rows: rows!, cols: cols!, world: unit.map(() => [0, 0, 0] as V3) }
})
const projected = Array.from({ length: 8 }, () => point())
const xy: number[] = []
const a = point(), b = point()
const ringPoint: V3 = [0, 0, 0]

/**
 * A convex, outward-wound face, with its actual plane normal in view space.
 * `bias` moves it in the painter's order only (not its shading): a closed
 * shell's skin can sort above everything sealed inside it.
 */
export function face(depth: Depth, project: Project, turn: Turn, corners: readonly V3[], width = 0, tone: Tone = 'ink', edge = 0.22, inside = false, bias = 0) {
  const A = corners[0]!, B = corners[1]!, C = corners[2]!
  const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2]
  const vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2]
  let n = turn(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx)
  let len = Math.hypot(...n)
  // At a pole one pair of a quad’s corners coincides. Use its surviving
  // triangle so the spherical cap stays closed at every resolution.
  if (len < 1e-7 && corners.length === 4) {
    const D = corners[3]!, wx = D[0] - A[0], wy = D[1] - A[1], wz = D[2] - A[2]
    n = turn(vy * wz - vz * wy, vz * wx - vx * wz, vx * wy - vy * wx)
    len = Math.hypot(...n)
  }
  if (len < 1e-7 || (!inside && n[2] <= 0)) return
  const sign = n[2] < 0 ? -1 : 1
  xy.length = 0
  let z = 0
  corners.forEach((v, i) => {
    const p = project(...v, projected[i]!)
    xy.push(p.x, p.y)
    z += p.z / corners.length
  })
  depth.face(xy, z + bias, lambert(n[0] * sign, n[1] * sign, n[2] * sign) * (0.9 + 0.1 * near(z)), tone)
  if (width) depth.path(xy, z + bias + 0.015, { width, alpha: edge * near(z), closed: true, join: 'round' })
}
const corners: V3[] = []
export function surface(depth: Depth, project: Project, turn: Turn, grid: typeof grids[number], width = 0, tone: Tone = 'ink', edge = 0.22) {
  for (const indices of grid.faces) {
    corners.length = 0
    for (const i of indices) corners.push(grid.world[i]!)
    face(depth, project, turn, corners, width, tone, edge)
  }
}

/** Segment sorting keeps the far half of a ring behind any solid it encloses. */
export function ring(depth: Depth, project: Project, circle: typeof circles[number], place: (c: number, s: number, out: V3) => void, width: number, alpha = 1, tone: Tone = 'ink') {
  const tmp = ringPoint
  for (let i = 0;i < circle.length - 1;i++) {
    place(...circle[i]!, tmp); project(...tmp, a)
    place(...circle[i + 1]!, tmp); project(...tmp, b)
    depth.line(a, b, width * (a.k + b.k) / 2, alpha * near((a.z + b.z) / 2), tone)
  }
}

/** The tangent silhouette in camera space, exact for a perspective sphere. */
export function limb(depth: Depth, radius: number, distance: number, cx: number, cy: number, circle: typeof circles[number], width: number, alpha = 0.75) {
  xy.length = 0
  const r = radius * distance / Math.sqrt(distance * distance - radius * radius)
  for (let i = 0;i < circle.length - 1;i++) xy.push(cx + r * circle[i]![0], cy - r * circle[i]![1])
  depth.path(xy, radius * radius / distance, { width, alpha, closed: true, join: 'round' })
}
