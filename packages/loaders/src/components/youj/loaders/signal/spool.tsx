'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { detail, pens } from './trace'

export const meta = {
  id: 'spool',
  title: 'Spool',
  category: 'signal',
  technique: 'paths',
  tags: ['drum', 'recorder', 'seismograph', 'cylinder', 'trace', '3d', 'helix', 'pen'],
  description: 'A recorder’s drum turns in perspective while the accent stylus writes a trace onto it, the line winding round and rising a step each turn, so the record spools up the drum and fades at the top.',
  order: 13,
  colors: [{ part: 'Record', mono: 'ink' }],
} satisfies LoaderMeta

/* A drum recorder: the drum turns about its axis and climbs a step each
 * turn, while a fixed stylus (the accent) writes on its face. What it wrote
 * travels round with the drum, out of sight behind it and back in front a
 * line higher, so the record winds up the drum as a helix, nearer stretches
 * brighter and the oldest fading at the top. Ribs on the drum turn with it.
 * The signal repeats every turn and the loop is one turn, so the record
 * after a loop is the record before it, a line higher: there's no seam.
 *
 * Color: the written trace is `c1` on the drum’s near side and turns back to the ink as it winds round behind. */

const RD = 26
const TOP = 31
const BOTTOM = -31
const STEP = 10
const WRITE = -24
const AMP = 7

/** The signal around one turn (0–1): a quiet line with two events in it. */
function signal(u: number) {
  let v = 0.06 * Math.sin(TAU * 7 * u)
  for (const [at, size] of [
    [0.12, 1],
    [0.58, 0.7],
  ] as const) {
    const d = u - at
    if (d > 0) v += size * Math.exp(-d / 0.07) * Math.sin(TAU * 14 * d)
  }
  return v
}

const LEVELS = [
  { lines: 2, samples: 48, ribs: 0, ellipse: 24 },
  { lines: 4, samples: 72, ribs: 6, ellipse: 36 },
  { lines: 5, samples: 110, ribs: 8, ellipse: 48 },
]

const depth = new Depth()
const p = point()
const q = point()

export const scene: Scene = {
  beats: 5,
  still: 0.3,
  draw(pen, t, view) {
    const lod = detail(view)
    const { lines, samples, ribs, ellipse } = LEVELS[lod]!
    const { hair, line, head } = pens(view)
    const project = camera({ pitch: -0.36, distance: 230, cx: view.w * 0.47, cy: view.h * 0.5 })
    const xy: number[] = []

    // The drum: its rims (the far half dashed), its sides, and ribs turning with it.
    for (const y of [TOP, BOTTOM]) {
      for (const near of [true, false]) {
        xy.length = 0
        for (let i = 0; i <= ellipse / 2; i++) {
          const a = (TAU * i) / ellipse + (near ? -Math.PI / 2 : Math.PI / 2)
          project(RD * Math.sin(a), y, RD * Math.cos(a), p)
          xy.push(p.x, p.y)
        }
        depth.path(xy, -1e3, near ? { width: hair, alpha: 0.42, join: 'round' } : { width: hair, alpha: 0.24, dash: [2 * hair, 2.5 * hair] })
      }
    }
    for (const side of [-1, 1]) depth.line(project(side * RD, TOP, 0, p), project(side * RD, BOTTOM, 0, q), hair, 0.42)
    // The spindle it turns on.
    if (lod > 0) depth.line(project(0, TOP, 0, p), project(0, TOP + 7, 0, q), line, 0.55)
    for (let k = 0; k < ribs; k++) {
      const a = TAU * (k / ribs + t)
      const facing = Math.cos(a)
      if (facing <= 0.05) continue
      depth.line(project(RD * Math.sin(a), TOP, RD * facing, p), project(RD * Math.sin(a), BOTTOM, RD * facing, q), hair, 0.16 * facing)
    }

    // The record: each point written `age` turns ago has turned that far round and risen that many steps.
    const total = lines * samples
    let run: number[] = []
    let runZ = 0
    let runAge = 0
    const flush = () => {
      if (run.length >= 4) {
        const n = run.length / 2
        const near = clamp(runZ / n / RD)
        const fade = 1 - runAge / n / lines
        depth.path(run, runZ / n, { width: line * (0.7 + 0.3 * near), alpha: (0.2 + 0.75 * near) * fade, join: 'round', tone: blend('ink', 'c1', span(near, 0.45, 0.75)) })
      }
      run = []
      runZ = 0
      runAge = 0
    }
    for (let i = 0; i <= total; i++) {
      const age = i / samples
      const a = TAU * age
      const z = RD * Math.cos(a)
      // Only the drum's near face shows; a run breaks where the record goes round the back.
      if (z < 0) {
        flush()
        continue
      }
      const y = WRITE + STEP * age + AMP * signal((((t - age) % 1) + 1) % 1)
      project(RD * Math.sin(a), y, z, p)
      run.push(p.x, p.y)
      runZ += p.z
      runAge += age
      if (run.length >= 16) {
        const [lx, ly] = [run[run.length - 2]!, run[run.length - 1]!]
        flush()
        run.push(lx, ly)
        runZ += p.z
        runAge += age
      }
    }
    flush()

    // The stylus: an arm swinging from a fixed pivot on the right to its tip on the drum's face, writing.
    const tipY = WRITE + AMP * signal(((t % 1) + 1) % 1)
    project(0, tipY, RD, p)
    project(RD + 16, WRITE + 14, RD * 0.5, q)
    depth.line(q, p, hair, 0.6)
    if (lod > 0) {
      // The pivot: a pin in a ring that knocks out the arm's end, so the arm meets it at its rim.
      xy.length = 0
      const r = 1.9 * q.k
      for (let i = 0; i < 16; i++) xy.push(q.x + r * Math.cos((TAU * i) / 16), q.y + r * Math.sin((TAU * i) / 16))
      depth.poly(xy, q.z + 0.5, 0, 'ink', true)
      depth.path(xy, q.z + 0.6, { width: hair, alpha: 0.7, closed: true })
      depth.dot(q, 0.55, 0.8)
    }
    depth.square(project(0, tipY, RD + 0.5, point()), head, 1, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A recorder's drum turns while the accent stylus writes a trace that winds up it. */
export function LoaderSpool(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
