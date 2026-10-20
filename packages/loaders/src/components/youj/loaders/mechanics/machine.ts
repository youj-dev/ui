import { TAU, lambert, projectPath, type Depth, type Project, type Stroke, type Tone } from '../field'

/** Small reusable machine geometry; scratch buffers are copied by Depth. */
export type V3 = [number, number, number]
export type Turn = (x: number, y: number, z: number) => V3
const xy: number[] = []
const ring: V3[] = Array.from({ length: 96 }, () => [0, 0, 0])
const quad: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const hole: number[] = []
const cap: V3[] = []

export function circle(depth: Depth, project: Project, x: number, y: number, z: number, r: number, width: number, alpha: number, tone: Tone = 'ink', samples = 32, layer?: number, dash?: readonly number[]) {
  for (let i = 0; i < samples; i++) {
    const a = TAU * i / samples
    ring[i]![0] = x + r * Math.cos(a)
    ring[i]![1] = y + r * Math.sin(a)
    ring[i]![2] = z
  }
  const path = projectPath(ring.slice(0, samples), project, xy)
  depth.path(path.xy, layer ?? path.z + 0.02, { width, alpha, tone, closed: true, join: 'round', dash })
}

/** A circle's outline in the plane z, counter-clockwise, as world points (for `part`'s outline or holes). */
export function disc(x: number, y: number, z: number, r: number, samples: number, out: V3[] = []): V3[] {
  out.length = samples
  for (let i = 0; i < samples; i++) {
    const a = TAU * i / samples
    const v = (out[i] ??= [0, 0, 0])
    v[0] = x + r * Math.cos(a)
    v[1] = y + r * Math.sin(a)
    v[2] = z
  }
  return out
}

/** Extruded polygon: outward-facing side walls, then the visible front, all flat lit. */
export function plate(depth: Depth, project: Project, turn: Turn, outline: readonly V3[], thickness: number, hair: number) {
  return part(depth, project, turn, outline, NONE, thickness, hair)
}
const NONE: readonly (readonly V3[])[] = []

/**
 * An extruded part with holes through it. Outline and holes lie in the
 * front plane, counter-clockwise. The outline's walls that face the viewer
 * are lit by their normals; so are the far walls inside each hole, where the
 * eye looks into it; and the front face is one fill with every hole left
 * open: each hole joins the outline by a zero-width bridge and runs the
 * other way round, so the fill's nonzero rule cuts it out and whatever lies
 * behind the part shows through. `bevel` (units) draws a chamfer line just
 * inside the front edge, catching the light. `layer`, if given, sorts the
 * whole part there (walls just under its face) instead of at its own depth,
 * for a part that stacks over others in a way the mean depths don't show.
 * `flat` draws the walls as one fill instead of facet by facet: the back
 * face, holes and all, laid just behind the front in the walls' average
 * light, so what shows of it round the edge and inside the holes is the
 * wall. Two fills instead of dozens, for many-toothed parts seen nearly
 * face on. `edgeTone` colors its edges (the faces stay lit ink). Returns the
 * layer for marks on the face.
 */
export function part(depth: Depth, project: Project, turn: Turn, outline: readonly V3[], holes: readonly (readonly V3[])[], thickness: number, hair: number, bevel = 0, edge = 0.8, layer?: number, flat = false, edgeTone: Tone = 'ink') {
  if (!flat) {
    for (let i = 0; i < outline.length; i++) wall(depth, project, turn, outline[i]!, outline[(i + 1) % outline.length]!, thickness, 1, layer)
    for (const h of holes) for (let i = 0; i < h.length; i++) wall(depth, project, turn, h[i]!, h[(i + 1) % h.length]!, thickness, -1, layer)
  }
  const front = projectPath(outline, project, xy)
  const z = layer === undefined ? front.z : layer + 0.005
  if (flat) {
    // The walls' light: their facing directions round the part, weighted by how squarely each faces us.
    let light = 0
    let weight = 0
    for (let k = 0; k < 8; k++) {
      const n = turn(Math.cos((TAU * k) / 8), Math.sin((TAU * k) / 8), 0)
      if (n[2] <= 0) continue
      light += lambert(...n) * n[2]
      weight += n[2]
    }
    const back = offset(outline, project, -thickness)
    if (holes.length) back.push(back[0]!, back[1]!)
    for (const h of holes) {
      const loop = offset(h, project, -thickness)
      back.push(loop[0]!, loop[1]!)
      for (let i = loop.length - 2; i >= 0; i -= 2) back.push(loop[i]!, loop[i + 1]!)
      back.push(back[0]!, back[1]!)
    }
    depth.face(back, z - 0.004, weight ? light / weight : 0.4)
  }
  const face = front.xy.slice()
  if (holes.length) face.push(face[0]!, face[1]!)
  for (const h of holes) {
    const loop = projectPath(h, project, hole).xy
    // From the outline's first corner: in to the hole, round it backwards, and out along the same bridge.
    face.push(loop[0]!, loop[1]!)
    for (let i = loop.length - 2; i >= 0; i -= 2) face.push(loop[i]!, loop[i + 1]!)
    face.push(face[0]!, face[1]!)
  }
  depth.face(face, z, lambert(...turn(0, 0, 1)))
  depth.path(front.xy, z + 0.01, { width: hair, alpha: edge, closed: true, join: 'round', tone: edgeTone })
  for (const h of holes) {
    const loop = projectPath(h, project, hole)
    depth.path(loop.xy, z + 0.01, { width: hair * 0.85, alpha: edge * 0.8, closed: true, join: 'round', tone: edgeTone })
  }
  if (bevel > 0) {
    // The chamfer: the outline pulled toward its centroid by `bevel` units, a fainter line just inside the edge.
    let cx = 0
    let cy = 0
    for (const v of outline) {
      cx += v[0] / outline.length
      cy += v[1] / outline.length
    }
    xy.length = 0
    for (const v of outline) {
      const d = Math.hypot(v[0] - cx, v[1] - cy) || 1
      const k = Math.max(0, d - bevel) / d
      project(cx + (v[0] - cx) * k, cy + (v[1] - cy) * k, v[2], P)
      xy.push(P.x, P.y)
    }
    depth.path(xy, z + 0.012, { width: hair * 0.7, alpha: edge * 0.32, closed: true, join: 'round', tone: edgeTone })
  }
  // Coplanar decoration belongs above this whole face, even when its own
  // centroid is farther away than the polygon's centroid.
  return z + 0.1
}
const P = { x: 0, y: 0, z: 0, k: 1 }

/** A loop of points moved dz along z, projected to flat screen [x, y, …] (a new array). */
function offset(points: readonly V3[], project: Project, dz: number): number[] {
  const out: number[] = []
  for (const v of points) {
    project(v[0], v[1], v[2] + dz, P)
    out.push(P.x, P.y)
  }
  return out
}

/** One side wall between front edge a→b and the same edge `thickness` behind; `sign` 1 faces out of an outline, -1 into a hole. */
function wall(depth: Depth, project: Project, turn: Turn, a: V3, b: V3, thickness: number, sign: number, layer?: number) {
  const n = turn(sign * (b[1] - a[1]), sign * (a[0] - b[0]), 0)
  if (n[2] <= 0) return
  for (let j = 0; j < 4; j++) {
    const v = j === 0 || j === 3 ? a : b
    quad[j]![0] = v[0]
    quad[j]![1] = v[1]
    quad[j]![2] = v[2] - (j < 2 ? thickness : 0)
  }
  const side = projectPath(quad, project, xy)
  depth.face(side.xy, layer ?? side.z, lambert(...n))
}

/**
 * A pin joint seen face on: a lit cap, its rim, and the centre dot where
 * the two parts it joins turn about each other. `layer` sorts it above the
 * face it sits on.
 */
export function pin(depth: Depth, project: Project, turn: Turn, x: number, y: number, z: number, r: number, hair: number, tone: Tone = 'ink', layer?: number) {
  const top = projectPath(disc(x, y, z, r, r * 8 > 20 ? 20 : 12, cap), project, xy)
  const at = layer ?? top.z
  depth.face(top.xy, at, lambert(...turn(0.25, 0.35, 1)), tone)
  depth.path(top.xy, at + 0.002, { width: hair, alpha: 0.9, closed: true, join: 'round' })
  project(x, y, z, P)
  depth.dot(P, Math.max(hair * 0.9, r * 0.22), 0.85)
}

export function rod(depth: Depth, project: Project, a: V3, b: V3, width: number, alpha: number, tone: Tone = 'ink', layer?: number, stroke?: Partial<Stroke>) {
  const line = projectPath([a, b], project, xy)
  depth.path(line.xy, layer ?? line.z, { width, alpha, tone, cap: 'round', ...stroke })
}
