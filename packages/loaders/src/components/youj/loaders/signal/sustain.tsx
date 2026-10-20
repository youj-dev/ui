'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, seeded, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { detail, pens } from './trace'

export const meta = {
  id: 'sustain',
  title: 'Sustain',
  category: 'signal',
  technique: 'lines',
  tags: ['spectrum', 'waterfall', 'ridgeline', 'spectrogram', 'perspective', 'notes', 'audio', '3d'],
  description: 'A waterfall of spectra in perspective: each new spectrum rises at the front and flows back into the distance, so a struck note leaves a ridge that rings on, dying away, as the stack recedes.',
  order: 3,
  colors: [{ part: 'New spectrum', mono: 'ink' }],
} satisfies LoaderMeta

/* Each row is a spectrum across the notes the interface's sounds are tuned
 * to (E minor pentatonic, low on the left), drawn as a line over a solid
 * face, so nearer rows hide the ones behind them. A new row rises at the
 * front (`enter`) and the stack flows back into the distance, fading; a note
 * struck in one row rings on through the rows after it, dying away, so a
 * strike is a ridge running back in time. The newest strike wears the accent
 * at its peak. The melody repeats every 12 rows and the stack moves 12 rows a
 * loop, so the loop has no seam.
 *
 * Color: each spectrum rises at the front in `c1` and settles to the ink within a row or two as it flows back; the struck peaks stay the accent. */

const ROWS_PER_LOOP = 12
const HALF = 36
/** The notes along the axis, in semitones above E5. */
const NOTES = [0, 3, 5, 7, 10, 12, 15, 17]
const noteX = (s: number) => -HALF + 6 + ((2 * HALF - 12) * s) / 17

/** When each note is struck, in rows, and how hard: a tap, a toggle, a bell, a success. */
const STRIKES: { row: number; note: number; amp: number; decay: number }[] = [
  { row: 0, note: 0, amp: 0.8, decay: 3.5 },
  { row: 1, note: 3, amp: 0.9, decay: 4 },
  { row: 3, note: 4, amp: 1, decay: 1.4 },
  { row: 5, note: 4, amp: 0.6, decay: 1.1 },
  { row: 6, note: 5, amp: 0.95, decay: 1.6 },
  { row: 8, note: 2, amp: 0.85, decay: 5 },
  { row: 10, note: 6, amp: 0.7, decay: 2 },
  { row: 11, note: 7, amp: 0.55, decay: 1.8 },
]

/** How loud each note is in row n (any real n): every strike so far, dying away, summed around the loop. */
function level(note: number, n: number) {
  let a = 0
  for (const s of STRIKES) {
    if (s.note !== note) continue
    const since = (((n - s.row) % ROWS_PER_LOOP) + ROWS_PER_LOOP) % ROWS_PER_LOOP
    a += (s.amp * Math.exp(-since / s.decay)) / (1 - Math.exp(-ROWS_PER_LOOP / s.decay))
  }
  return a
}

const LEVELS = [
  { rows: 6, samples: 36, width: 4.2 },
  { rows: 8, samples: 56, width: 3.4 },
  { rows: 10, samples: 84, width: 2.9 },
]

const DEPTH = 80
/** Each row's noise floor, a phase per row of the loop. */
const random = seeded(7)
const FLOOR = Array.from({ length: ROWS_PER_LOOP }, () => random())
const HEIGHT = 25
const depth = new Depth()
const p = point()

export const scene: Scene = {
  beats: 6,
  still: 0.31,
  draw(pen, t, view) {
    const lod = detail(view)
    const { rows, samples, width } = LEVELS[lod]!
    const { hair, line, head } = pens(view)
    const gap = DEPTH / rows
    const project = camera({ yaw: -0.3, pitch: -0.46, distance: 270, cx: view.w / 2 + 4, cy: view.h * 0.56 })
    const now = t * ROWS_PER_LOOP

    // Rows from the oldest still showing to the newest, each at its age.
    const newest = Math.floor(now)
    const wrap = (n: number) => ((n % ROWS_PER_LOOP) + ROWS_PER_LOOP) % ROWS_PER_LOOP
    let lastStrike = newest
    while (!STRIKES.some((s) => s.row === wrap(lastStrike))) lastStrike--
    for (let n = newest - rows; n <= newest; n++) {
      const age = now - n
      const z = DEPTH / 2 - age * gap
      const rise = view.ease.enter(span(age, 0, 0.9))
      const fade = span(age, 0, 0.35) * (1 - span(age, rows - 1.4, rows))
      if (fade <= 0) continue
      const near = clamp(1 - age / rows)
      const noise = FLOOR[wrap(n)]!
      const levels = NOTES.map((_, j) => level(j, n))
      const xy: number[] = []
      let peak = -1
      let peakY = 0
      for (let i = 0; i <= samples; i++) {
        const x = -HALF + (2 * HALF * i) / samples
        let y = 0.9 + 0.7 * Math.sin(x * 0.55 + noise * TAU) * Math.sin(x * 0.21 + noise * 9)
        levels.forEach((a, j) => {
          y += a * HEIGHT * Math.exp(-(((x - noteX(NOTES[j]!)) / width) ** 2))
        })
        y = Math.max(y, 0) * rise
        project(x, y, z, p)
        xy.push(p.x, p.y)
        if (y > peak) {
          peak = y
          peakY = i
        }
      }
      // The face beneath the line, down to the floor: it hides the rows behind.
      const face = [...xy]
      project(HALF, 0, z, p)
      face.push(p.x, p.y)
      project(-HALF, 0, z, p)
      face.push(p.x, p.y)
      depth.poly(face, z, 0.035 * fade, 'ink', true)
      project(0, 0, z, p)
      depth.path(xy, z, { width: line * Math.min(p.k, 1.15), alpha: (0.3 + 0.65 * near ** 1.3) * fade, join: 'round', tone: blend('ink', 'c1', 0.85 * span(near, 0.8, 1)) })

      // The newest strike's peak, in the accent, while it's still near.
      if (n === lastStrike && age < 3) {
        depth.square({ x: xy[peakY * 2]!, y: xy[peakY * 2 + 1]!, z: z + 0.01, k: 1 }, head, fade * (1 - span(age, 1.6, 3)), 'accent')
      }
    }

    if (lod === 2) {
      // The axis along the front edge, a tick under each note.
      const front = DEPTH / 2 + 4
      depth.line(project(-HALF, 0, front, point()), project(HALF, 0, front, point()), hair, 0.22)
      for (const s of NOTES) depth.line(project(noteX(s), 0, front, point()), project(noteX(s), -3, front, point()), hair, 0.36)
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A waterfall of spectra in perspective, each struck note ringing on as a ridge that recedes. */
export function LoaderSustain(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
