'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, hump, lambert, orient, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'mosaic', title: 'Mosaic', category: 'geometry', technique: 'planes',
  tags: ['voronoi', 'cells', 'partition', 'tessellation', 'nearest neighbour', 'relaxation'],
  description: 'A slab partitions into moving nearest-neighbour cells. Every shared boundary follows its two sites exactly; shallow cell walls rise in a circulating wave, and one short edge catches the accent as the tessellation relaxes back.',
  order: 31,
  colors: [{ part: 'Cells', mono: 'ink' }],
} satisfies LoaderMeta

const SITES = [[-19, -19], [17, -18], [-18, 17], [18, 18], [0, -2], [-4, 26], [27, 0]]
const sites = SITES.map(() => [0, 0])
const buffers: number[][] = [[], []]
const depth = new Depth()
const P = [point(), point(), point(), point()]
const xy: number[] = []

/** Clip the footprint to the half-plane nearer site i than site j. */
function cell(i: number, count: number) {
  let input = buffers[0]!, output = buffers[1]!
  input.length = 0; input.push(-31, -31, 31, -31, 31, 31, -31, 31)
  const site = sites[i]!
  for (let j = 0; j < count; j++) {
    if (j === i) continue
    const other = sites[j]!
    const nx = other[0]! - site[0]!, nz = other[1]! - site[1]!
    const c = (other[0]! ** 2 + other[1]! ** 2 - site[0]! ** 2 - site[1]! ** 2) / 2
    output.length = 0
    for (let k = 0; k < input.length; k += 2) {
      const next = (k + 2) % input.length
      const ax = input[k]!, az = input[k + 1]!, bx = input[next]!, bz = input[next + 1]!
      const da = nx * ax + nz * az - c, db = nx * bx + nz * bz - c
      if (da <= 0) output.push(ax, az)
      if ((da <= 0) !== (db <= 0)) {
        const u = da / (da - db)
        output.push(ax + (bx - ax) * u, az + (bz - az) * u)
      }
    }
    const swap = input; input = output; output = swap
  }
  return input
}

export const scene: Scene = {
  beats: 5, still: 0.33,
  draw(pen, t, view) {
    const small = view.size < 32
    const count = small ? 4 : 7
    const hair = (small ? 1 : 1.05) / view.px
    const pose = { yaw: -0.5, pitch: -0.67 }
    const project = camera({ ...pose, distance: 380, cx: 50, cy: 55 })
    const turn = orient(pose)
    for (let i = 0; i < count; i++) {
      const phase = TAU * (t + i / count)
      sites[i]![0] = SITES[i]![0]! + 4 * Math.sin(phase)
      sites[i]![1] = SITES[i]![1]! + 4 * Math.cos(phase)
    }
    for (let i = 0; i < count; i++) {
      const polygon = cell(i, count)
      const height = 1 + 5 * view.ease.standard(hump((t + i / count) % 1))
      // Each cell is drawn whole (walls, then top) at the depth of its middle: adjacent prisms on a plane
      // stack correctly that way, where sorting their faces one by one lets a wall slip over a neighbour.
      let mx = 0
      let mz = 0
      for (let k = 0; k < polygon.length; k += 2) {
        mx += polygon[k]! / (polygon.length / 2)
        mz += polygon[k + 1]! / (polygon.length / 2)
      }
      project(mx, 0, mz, P[0]!)
      const z = P[0]!.z
      for (let k = 0; k < polygon.length; k += 2) {
        const next = (k + 2) % polygon.length
        const ax = polygon[k]!, az = polygon[k + 1]!, bx = polygon[next]!, bz = polygon[next + 1]!
        const n = turn(bz - az, 0, ax - bx)
        if (n[2] <= 0) continue
        project(ax, -4, az, P[0]!); project(bx, -4, bz, P[1]!); project(bx, height, bz, P[2]!); project(ax, height, az, P[3]!)
        xy.length = 0
        for (const p of P) xy.push(p.x, p.y)
        depth.face(xy, z, lambert(...n))
      }
      xy.length = 0
      for (let k = 0; k < polygon.length; k += 2) {
        project(polygon[k]!, height, polygon[k + 1]!, P[0]!)
        xy.push(P[0]!.x, P[0]!.y)
      }
      depth.face(xy, z + 0.05, lambert(...turn(0, 1, 0)))
      depth.path(xy, z + 0.08, { width: hair, alpha: 0.72, closed: true, join: 'round', tone: blend('ink', 'c1', 0.6 * hump((((t - i / sites.length) % 1) + 1) % 1)) })
      if (i === 0) depth.path(xy.slice(0, 4), z + 0.1, { width: hair * 1.4, alpha: 0.95, tone: 'accent' })
      // The cell's site, the point every one of its boundaries is drawn from, marked on its top.
      if (view.size >= 64) {
        project(sites[i]![0]!, height + 0.05, sites[i]![1]!, P[0]!)
        P[0]!.z = z + 0.09
        depth.square(P[0]!, (view.size < 160 ? 1.8 : 2.2) / view.px, 0.75, 'c1')
      }
    }
    depth.flush(pen)
  },
}
/* Color: a hue of `c1` circulates through the cells’ top edges
 * once a loop, and their sites are marked in it; the lead cell’s edge stays
 * the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Exact nearest-neighbour footprints become a softly circulating relief. */
export function LoaderMosaic(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
