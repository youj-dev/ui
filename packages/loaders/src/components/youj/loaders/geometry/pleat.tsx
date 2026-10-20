'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'pleat',
  title: 'Pleat',
  category: 'geometry',
  technique: 'planes',
  tags: ['fold', 'accordion', 'zigzag', 'panels', 'paper', 'bellows', 'origami'],
  description:
    'A strip of square panels folds like an accordion, crease by crease from one end, into a tight stack, then opens out flat again; each panel is lit by where it faces, one of them in the accent.',
  order: 8,
  colors: [{ part: 'Fold marks', mono: 'ink' }],
} satisfies LoaderMeta

/* A strip of square panels with alternating mountain and valley creases,
 * seen from above and to one side. The creases fold one after another from
 * the left (`emphasized`, each a moment behind the last) until the strip is
 * a tight zigzag stack, the view closing in on it as it gathers, then open
 * again in the same order. Every panel is a
 * lit face: as they fold, alternate panels turn toward the light and away
 * from it, so the pleats read light, dark, light. The middle panel is the
 * accent. Open at both ends of the loop.
 *
 * Color: the dashed mountain and valley marks waiting to fold are `c1`
 *, and give way to the ink crease as each one shuts; the middle
 * panel stays the accent. */

const N = 5
const W = 18.6
const D = W / 2
const OPEN = 0.34
const SHUT = 1.34
const YAW = -0.62
const PITCH = -0.66

const depth = new Depth()
const corners = [point(), point(), point(), point()]
const mid = point()
const a = point()
const b = point()
const xs: number[] = []
const ys: number[] = []
const folds: number[] = []
const keys: number[] = []
const FIT = 0.9

export const scene: Scene = {
  beats: 5,
  still: 0.24,
  draw(pen, t, view) {
    const small = view.size < 32
    // A slow sway keeps the strip turning in the light while it holds open and while it holds shut.
    const yaw = YAW + 0.08 * Math.sin(TAU * t)
    const project = camera({ yaw, pitch: PITCH, distance: 300, cx: view.w / 2, cy: view.h / 2 + 4 })
    const turn = orient({ yaw, pitch: PITCH })
    const hair = (small ? 1.1 : 1) / view.px
    const dash = clamp(view.size * 0.016, 2, 4) / view.px

    // Each crease folds a moment after the one before it, and opens in the same order.
    xs.length = 0
    ys.length = 0
    folds.length = 0
    let x = 0
    let y = 0
    xs.push(x)
    ys.push(y)
    const angles: number[] = []
    let folded = 0
    for (let i = 0; i < N; i++) {
      const fold = view.ease.emphasized(span(t, 0.03 + i * 0.04, 0.31 + i * 0.04)) - view.ease.emphasized(span(t, 0.52 + i * 0.04, 0.8 + i * 0.04))
      folds.push(fold)
      folded += fold / N
      const a = mix(OPEN, SHUT, fold)
      angles.push(a)
      x += W * Math.cos(a)
      y += (i % 2 ? -1 : 1) * W * Math.sin(a)
      xs.push(x)
      ys.push(y)
    }
    // Center the strip on its own extent, and close in on it as it gathers into a stack.
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    const zoom = FIT * mix(1, 1.5, view.ease.standard(folded))
    const d = D * zoom
    const at = (i: number) => [(xs[i]! - cx) * zoom, (ys[i]! - cy) * zoom] as const

    keys.length = 0
    for (let i = 0; i < N; i++) {
      const [x0, y0] = at(i)
      const [x1, y1] = at(i + 1)
      project(x0, y0, -d, corners[0]!)
      project(x1, y1, -d, corners[1]!)
      project(x1, y1, d, corners[2]!)
      project(x0, y0, d, corners[3]!)
      project((x0 + x1) / 2, (y0 + y1) / 2, 0, mid)
      keys.push(mid.z)
      // The panel's normal, turned to whichever side faces us.
      const s = i % 2 ? -1 : 1
      const ang = angles[i]!
      let [nx, ny, nz] = turn(-s * Math.sin(ang), Math.cos(ang), 0)
      if (nz < 0) [nx, ny, nz] = [-nx, -ny, -nz]
      const xy = corners.flatMap((c) => [c.x, c.y])
      depth.face(xy, mid.z, lambert(nx, ny, nz), i === (N - 1) / 2 ? 'accent' : 'ink')
      // Its cut edges: the strip's two long sides, and its ends. The creases are drawn on their own.
      const [c0, c1, c2, c3] = corners as [typeof a, typeof a, typeof a, typeof a]
      depth.path([c0.x, c0.y, c1.x, c1.y], mid.z, { width: hair, alpha: 0.55 })
      depth.path([c2.x, c2.y, c3.x, c3.y], mid.z, { width: hair, alpha: 0.55 })
      if (i === 0) depth.path([c3.x, c3.y, c0.x, c0.y], mid.z, { width: hair, alpha: 0.55 })
      if (i === N - 1) depth.path([c1.x, c1.y, c2.x, c2.y], mid.z, { width: hair, alpha: 0.55 })
    }

    // The creases, marked as folds are on a pattern (a valley dashed, a mountain dash-dotted), becoming edges as they close.
    for (let i = 1; i < N; i++) {
      const [x0, y0] = at(i)
      project(x0, y0, -d, a)
      project(x0, y0, d, b)
      const key = Math.max(keys[i - 1]!, keys[i]!) + 0.01
      const shut = view.ease.standard(clamp(((folds[i - 1]! + folds[i]!) / 2 - 0.15) / 0.5))
      if (shut > 0.004) depth.path([a.x, a.y, b.x, b.y], key, { width: hair, alpha: 0.6 * shut })
      if (shut < 0.996) {
        const len = Math.hypot(b.x - a.x, b.y - a.y)
        if (small) depth.path([a.x, a.y, b.x, b.y], key, { width: hair, alpha: 0.4 * (1 - shut), tone: 'c1' })
        else {
          // A fixed number of dashes, so they close up with the crease rather than crawl along it.
          const count = Math.max(3, Math.round((2 * D * FIT * view.px) / (dash * view.px * 2)))
          const u = len / count
          const mountain = i % 2 === 1
          depth.path([a.x, a.y, b.x, b.y], key, {
            width: hair,
            alpha: 0.55 * (1 - shut),
            tone: 'c1',
            dash: mountain ? [u * 0.5, u * 0.18, u * 0.14, u * 0.18] : [u * 0.6, u * 0.4],
            offset: mountain ? -u * 0.09 : -u * 0.2,
          })
        }
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A strip of square panels folds like an accordion into a stack, lit pleat by pleat, and opens again. */
export function LoaderPleat(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
