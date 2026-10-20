'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'layers',
  title: 'Layers',
  category: 'depth',
  technique: 'mixed',
  tags: ['card', 'exploded', 'stack', 'build', 'ui', 'axonometric', 'compose'],
  description: 'A card comes apart into what it’s made of, its surface, content, outline and accent, in an exploded view with construction lines, then closes again.',
  order: 3,
  colors: [{ part: 'Content', mono: 'ink' }],
} satisfies LoaderMeta

/* Seen from above at an angle, the card is a stack of particle planes, each
 * edged with a hairline so it reads as a sheet: its surface, its content (a
 * header, two lines of text, a picture), its outline, and the accent
 * particle at its corner. The planes rise apart one after another
 * (`emphasized`), hold as an exploded view with construction lines dropped
 * from their corners, and close again, top first, while the view rocks a
 * little so the depth reads. Assembled at both ends of the loop.
 *
 * Color: the content layer warms toward `c1` as the card comes apart, and back to the ink as it closes. */

const W = 27
const D = 18
/** Where the accent particle sits on the card. */
const ACCENT_AT: [number, number] = [W - 4, -D + 3]

interface Plane {
  /** Points on the plane, in world x and z. */
  pts: [number, number][]
  alpha: number
  /** Height when assembled and when apart. */
  lo: number
  hi: number
  accent?: boolean
}

function card(nx: number, nz: number): Plane[] {
  const at = (i: number, j: number): [number, number] => [-W + (2 * W * i) / (nx - 1), -D + (2 * D * j) / (nz - 1)]
  const surface: [number, number][] = []
  const content: [number, number][] = []
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      surface.push(at(i, j))
      const header = j === 0
      const text = (j === 2 && i < nx * 0.7) || (j === 3 && i < nx * 0.45)
      const media = j >= nz - Math.ceil(nz * 0.38) && i >= Math.floor(nx * 0.5)
      if (header || text || media) content.push(at(i, j))
    }
  }
  const outline: [number, number][] = []
  const per = nx * 2
  for (let s = 0; s < per; s++) {
    const u = s / per
    outline.push([-W + 2 * W * u, -D - 4], [W - 2 * W * u, D + 4])
  }
  const side = Math.round(per * (D / W))
  for (let s = 0; s < side; s++) {
    const u = s / side
    outline.push([W + 4, -D - 4 + (2 * D + 8) * u], [-W - 4, D + 4 - (2 * D + 8) * u])
  }
  return [
    { pts: surface, alpha: 0.34, lo: 0, hi: 0 },
    { pts: content, alpha: 0.95, lo: 1.5, hi: 13 },
    { pts: outline, alpha: 0.8, lo: 2.5, hi: 26 },
    { pts: [ACCENT_AT], alpha: 1, lo: 5, hi: 38, accent: true },
  ]
}

const DETAIL = [
  { below: 32, planes: card(7, 5) },
  { below: 80, planes: card(9, 6) },
  { below: Infinity, planes: card(12, 8) },
]

const CORNERS = [
  [-W - 4, -D - 4],
  [W + 4, -D - 4],
  [W + 4, D + 4],
  [-W - 4, D + 4],
] as const

const depth = new Depth()
const p = point()
const q = point()
const shade = (z: number) => 0.4 + 0.6 * clamp((z + 40) / 80)

export const scene: Scene = {
  beats: 4.5,
  still: 0.5,
  draw(pen, t, view) {
    const { planes } = DETAIL.find((d) => view.size < d.below)!
    const project = camera({ yaw: -0.62 + 0.16 * Math.sin(TAU * t), pitch: -0.62, distance: 260, cx: view.w / 2, cy: view.h * 0.66 })
    const side = clamp(view.size * 0.036, 1.25, 2.6) / view.px
    const hair = 1 / view.px

    let apart = 0
    let accentY = 0
    let contentY = 0
    planes.forEach((plane, i) => {
      const up = view.ease.emphasized(span(t, 0.06 + 0.06 * i, 0.4 + 0.06 * i))
      const down = view.ease.emphasized(span(t, 0.56 + 0.06 * (planes.length - 1 - i), 0.88 + 0.03 * (planes.length - 1 - i)))
      const lift = up * (1 - down)
      if (i === planes.length - 2) apart = lift
      const y = mix(plane.lo, plane.hi, lift)
      if (i === 1) contentY = y
      // The content layer warms toward its color as the card comes apart, and cools as it closes.
      const content = blend('ink', 'c1', 0.85 * lift)
      if (plane.accent) accentY = y
      if (i < 2) {
        // The plane's own edge, a hairline, so it reads as a sheet and not loose points.
        CORNERS.forEach(([x1, z1], c) => {
          const [x2, z2] = CORNERS[(c + 1) % 4]!
          project(x1 + (x1 < 0 ? 1 : -1), y, z1 + (z1 < 0 ? 1 : -1), p)
          project(x2 + (x2 < 0 ? 1 : -1), y, z2 + (z2 < 0 ? 1 : -1), q)
          depth.line(p, q, hair, (i === 0 ? 0.3 : 0.22) * shade((p.z + q.z) / 2))
        })
      }
      for (const [x, z] of plane.pts) {
        project(x, y, z, p)
        depth.square(p, plane.accent ? side * 2.3 : side, plane.alpha * (plane.accent ? 1 : shade(p.z)), plane.accent ? 'accent' : i === 1 ? content : 'ink')
      }
    })

    // Construction lines from the card's corners up through the planes while it's apart, with a crop mark
    // where each meets the outline's plane; and a leader from the accent particle down to the spot it came from.
    if (apart > 0.01) {
      const top = 26 * apart
      for (const [x, z] of CORNERS) {
        project(x, 0, z, p)
        project(x, top, z, q)
        depth.line(p, q, hair, 0.22 * apart * shade(p.z))
        if (view.size >= 64) {
          const arm = 3.2
          project(x, top, z, p)
          project(x - Math.sign(x) * arm, top, z, q)
          depth.line(p, q, hair, 0.45 * apart * shade(p.z))
          project(x, top, z - Math.sign(z) * arm, q)
          depth.line(p, q, hair, 0.45 * apart * shade(p.z))
        }
      }
      if (view.size >= 40) {
        const [ax, az] = ACCENT_AT
        project(ax, contentY, az, p)
        project(ax, accentY, az, q)
        const length = Math.hypot(q.x - p.x, q.y - p.y)
        const dash = 1.6 / view.px
        depth.path([p.x, p.y, q.x, q.y], (p.z + q.z) / 2 - 0.5, { width: hair, alpha: 0.4 * apart, dash: [dash, dash], offset: -length % (2 * dash) })
        project(ax - 1.8, contentY, az, p)
        project(ax + 1.8, contentY, az, q)
        depth.line(p, q, hair, 0.5 * apart)
        project(ax, contentY, az - 1.8, p)
        project(ax, contentY, az + 1.8, q)
        depth.line(p, q, hair, 0.5 * apart)
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A card comes apart into its layers in an exploded view, then closes again. */
export function LoaderLayers(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
