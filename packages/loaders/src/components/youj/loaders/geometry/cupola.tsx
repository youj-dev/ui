'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'cupola', title: 'Cupola', category: 'geometry', technique: 'mixed',
  tags: ['dome', 'shell', 'triangulation', 'construction', 'panels', 'architecture'],
  description: 'A triangulated dome erects from its circular footing. Meridian struts raise successive rings, diagonal braces close each bay, and lit panels settle along one open bank before the crown joins and the shell dismantles from the top.',
  order: 50,
  colors: [{ part: 'Struts', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
interface Vertex { p: V3; level: number; sector: number }
interface Edge { a: number; b: number; level: number; sector: number; brace: boolean }
interface Panel { corners: [number, number, number]; normal: V3; level: number; sector: number }

function dome(sectors: number, tiers: number) {
  const vertices: Vertex[] = []
  const edges: Edge[] = []
  const panels: Panel[] = []
  for (let level = 0; level < tiers; level++) {
    const latitude = Math.PI / 2 * level / tiers
    for (let sector = 0; sector < sectors; sector++) {
      const a = TAU * sector / sectors
      vertices.push({ p: [29 * Math.cos(latitude) * Math.cos(a), -19 + 38 * Math.sin(latitude), 29 * Math.cos(latitude) * Math.sin(a)], level, sector })
    }
  }
  const crown = vertices.length
  vertices.push({ p: [0, 19, 0], level: tiers, sector: 0 })
  const index = (level: number, sector: number) => level === tiers ? crown : level * sectors + sector % sectors
  const triangle = (a: number, b: number, c: number, level: number, sector: number) => {
    const A = vertices[a]!.p, B = vertices[b]!.p, C = vertices[c]!.p
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]]
    const v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]]
    const n: V3 = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!]
    if (n[0] * (A[0] + B[0] + C[0]) + n[1] * (A[1] + B[1] + C[1] + 57) + n[2] * (A[2] + B[2] + C[2]) < 0) {
      n[0] *= -1; n[1] *= -1; n[2] *= -1
    }
    panels.push({ corners: [a, b, c], normal: n, level, sector })
  }
  for (let level = 0; level < tiers; level++) for (let sector = 0; sector < sectors; sector++) {
    const a = index(level, sector), b = index(level, sector + 1)
    const c = index(level + 1, sector), d = index(level + 1, sector + 1)
    edges.push({ a, b, level, sector, brace: false }, { a, b: c, level: level + 1, sector, brace: false })
    if (level + 1 < tiers) {
      edges.push({ a, b: d, level: level + 1, sector, brace: true })
      triangle(a, c, d, level + 1, sector)
      triangle(a, d, b, level + 1, sector)
    } else triangle(a, c, b, level + 1, sector)
  }
  return { vertices, edges, panels, tiers, sectors, points: vertices.map(() => [0, 0, 0] as V3) }
}
const DOMES = [dome(6, 2), dome(8, 3), dome(12, 4)]
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6, still: 0.6,
  draw(pen, t, view) {
    const small = view.size < 32
    const model = DOMES[small ? 0 : view.size < 80 ? 1 : 2]!
    const hair = (small ? 1.05 : 1) / view.px
    const pose = { yaw: -0.36, pitch: -0.44 }
    const project = camera({ ...pose, distance: 330, cx: view.w / 2, cy: 55 })
    const turn = orient(pose)
    const ready = (level: number, sector: number, delay = 0) => {
      if (level === 0) return 1
      const from = 0.045 + (level - 1) * 0.35 / model.tiers + sector * 0.018 / model.sectors + delay
      const off = 0.75 + (model.tiers - level) * 0.15 / model.tiers
      return clamp(view.ease.emphasized(span(t, from, from + 0.15))) * (1 - clamp(view.ease.standard(span(t, off, off + 0.095))))
    }
    model.vertices.forEach((v, i) => {
      const k = ready(v.level, v.sector)
      const w = model.points[i]!
      w[0] = v.p[0]; w[1] = mix(-19, v.p[1], k); w[2] = v.p[2]
    })

    for (const edge of model.edges) {
      const A = model.points[edge.a]!, B = model.points[edge.b]!
      const k = ready(edge.level, edge.sector, edge.brace ? 0.075 : 0)
      if (k < 0.003) continue
      project(...A, p)
      project(mix(A[0], B[0], k), mix(A[1], B[1], k), mix(A[2], B[2], k), q)
      const near = clamp(0.68 + (p.z + q.z) / 180, 0.32, 0.95)
      // A strut rises in the dome's color and settles to the ink once it's set.
      depth.line(p, q, hair * (edge.brace ? 0.72 : 1) * (p.k + q.k) / 2, near * (edge.level === 0 ? 0.7 : k), blend('c1', 'ink', k))
    }

    // Skin only one bank: the open bank reveals the shell's actual depth
    // and its triangular load paths, including the farther struts.
    for (const panel of model.panels) {
      if (panel.sector < Math.floor(model.sectors / 4) || panel.sector > Math.floor(model.sectors / 4) + 1) continue
      const n = turn(...panel.normal)
      if (n[2] <= 0) continue
      const k = clamp(view.ease.emphasized(span(t, 0.39 + panel.level * 0.025, 0.53 + panel.level * 0.025))) *
        (1 - clamp(view.ease.exit(span(t, 0.71 + (model.tiers - panel.level) * 0.018, 0.8 + (model.tiers - panel.level) * 0.018))))
      if (k < 0.003) continue
      const A = model.points[panel.corners[0]]!, B = model.points[panel.corners[1]]!, C = model.points[panel.corners[2]]!
      const cx = (A[0] + B[0] + C[0]) / 3, cy = (A[1] + B[1] + C[1]) / 3, cz = (A[2] + B[2] + C[2]) / 3
      xy.length = 0
      let z = 0
      for (const index of panel.corners) {
        const v = model.points[index]!
        project(mix(cx, v[0], k), mix(cy, v[1], k) + 5 * (1 - k), mix(cz, v[2], k), p)
        xy.push(p.x, p.y); z += p.z / 3
      }
      depth.face(xy, z + 0.04, lambert(...n))
      depth.path(xy, z + 0.06, { width: hair * 0.65, alpha: 0.65 * k, closed: true })
    }

    const lock = clamp(view.ease.standard(span(t, 0.57, 0.65))) * (1 - clamp(view.ease.exit(span(t, 0.69, 0.75))))
    const top = model.points[model.points.length - 1]!
    const shoulder = model.points[(model.tiers - 1) * model.sectors + Math.floor(model.sectors / 4)]!
    project(...top, p)
    project(mix(top[0], shoulder[0], lock), mix(top[1], shoulder[1], lock), mix(top[2], shoulder[2], lock), q)
    depth.line(p, q, hair * 1.4, lock, 'accent')
    if (!small) for (let i = 0; i < model.sectors; i++) {
      const a = TAU * i / model.sectors
      project(31 * Math.cos(a), -19, 31 * Math.sin(a), p)
      project(34 * Math.cos(a), -19, 34 * Math.sin(a), q)
      depth.line(p, q, hair * 0.7, 0.25)
    }
    depth.flush(pen)
  },
}

/* Color: each strut rises in `c1` and settles to the ink once it’s
 * set, so the erection climbs the dome as a front of color; the crown lock
 * stays the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Meridian struts, ring braces and a bank of lit panels assemble a domed shell. */
export function LoaderCupola(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
