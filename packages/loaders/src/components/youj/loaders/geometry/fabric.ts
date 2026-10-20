import { clamp, lambert, point, type Depth, type Project, type Tone } from '../field'

/* Reused corner storage for the rectangular stock in this group. Bounds
 * are world coordinates; light is the camera's orientation of a normal. */
const corners = Array.from({ length: 8 }, point)
const xy: number[] = []
const faces = [
  { ids: [2, 3, 7, 6], n: [0, 1, 0] },
  { ids: [4, 5, 7, 6], n: [0, 0, 1] },
  { ids: [1, 3, 7, 5], n: [1, 0, 0] },
  { ids: [0, 2, 6, 4], n: [-1, 0, 0] },
  { ids: [0, 1, 3, 2], n: [0, 0, -1] },
] as const

export function stock(
  depth: Depth, project: Project, light: (x: number, y: number, z: number) => [number, number, number],
  x: number, y: number, z: number, w: number, h: number, d: number, hair: number,
  top: Tone = 'ink', edges = true, edge: Tone = 'ink',
) {
  for (let i = 0; i < 8; i++) project(x + (i & 1 ? w : -w) / 2, y + (i & 2 ? h : -h) / 2, z + (i & 4 ? d : -d) / 2, corners[i]!)
  for (const face of faces) {
    const normal = light(face.n[0], face.n[1], face.n[2])
    if (normal[2] <= 0) continue
    let order = 0
    xy.length = 0
    for (const i of face.ids) { const p = corners[i]!; xy.push(p.x, p.y); order += p.z / 4 }
    depth.face(xy, order, lambert(...normal), face.n[1] === 1 ? top : 'ink')
    if (edges) depth.path(xy, order + 0.015, { width: hair, alpha: clamp(0.64 + order / 180, 0.4, 0.84), closed: true, tone: edge })
  }
}
