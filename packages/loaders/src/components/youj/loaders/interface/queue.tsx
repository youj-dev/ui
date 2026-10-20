'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, span, roundedRect, Depth, projectPath, type Project, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'queue',
  title: 'Queue',
  category: 'interface',
  technique: 'planes',
  tags: ['toast', 'notification', 'stack', 'cards', 'depth', 'feed', 'messages'],
  description: 'Notifications queue up in depth: each new toast rises in at the front, the ones before it step back and dim, and the oldest fades away at the back.',
  order: 7,
  colors: [{ part: 'Timer', mono: 'ink' }],
} satisfies LoaderMeta

/* A stack of toasts seen a little from the side, each a card that hides
 * the ones behind it: an accent dot, a title and a line of text, a lit top
 * edge. A new toast rises into the front place (`emphasized`) as every
 * other steps back one place, smaller and dimmer with distance, and the one
 * in the last place fades out. Its lines write in as it lands, and a timer
 * hairline runs along its foot while it waits, full as the next one comes.
 * One step a loop, and every toast keeps its own clock, so the loop has no
 * seam.
 *
 * Color: each toast’s timer, the time gone along its foot, runs in `c1`; the cards and their text keep the ink, each toast’s mark the accent. */

const PLACES = 4
const STEP_Z = 15
const STEP_Y = 6.5
const CARD = { x: -30, y: -9, w: 60, h: 18, r: 3.5 }

const depth = new Depth()
const xy: number[] = []

/** A toast: `typed` (0–1) writes its lines in, `timer` (0–1) runs its foot's hairline, shown by `front`. */
function toast(project: Project, x: number, y: number, z: number, alpha: number, hair: number, stroke: number, typed: number, timer: number, front: number, detail: boolean) {
  const at = (px: number, py: number) => [x + px, y - py, z] as const
  const card = projectPath(
    roundedRect(CARD.x, CARD.y, CARD.w, CARD.h, CARD.r, 4).map(([a, b]) => at(a, b)),
    project,
    xy,
  )
  depth.poly(card.xy, z, 0.1 * alpha, 'ink', true)
  depth.path(card.xy, z + 0.01, { width: hair, alpha: 0.5 * alpha, closed: true, join: 'round' })
  const line = (ax: number, ay: number, bx: number, by: number, width: number, a: number, cap: 'round' | 'butt' = 'round', tone: Tone = 'ink') => {
    const bar = projectPath([at(ax, ay), at(bx, by)], project, xy)
    depth.path(bar.xy, z + 0.02, { width, alpha: a, cap, tone })
  }
  // The lit top edge, inside the card's corners.
  if (detail) line(CARD.x + CARD.r, CARD.y + 0.9, CARD.x + CARD.w - CARD.r, CARD.y + 0.9, hair, 0.22 * alpha, 'butt')
  const dot = projectPath(
    roundedRect(CARD.x + 5, CARD.y + 6.2, 5.6, 5.6, 1.2, 2).map(([a, b]) => at(a, b)),
    project,
    xy,
  )
  depth.poly(dot.xy, z + 0.02, alpha, 'accent')
  // The title and the line of text, written in as it lands.
  const title = clamp(typed / 0.6)
  const body = clamp((typed - 0.3) / 0.7)
  if (title > 0.01) line(CARD.x + 15, CARD.y + 6, CARD.x + 15 + 24 * title, CARD.y + 6, stroke, 0.85 * alpha)
  if (body > 0.01) line(CARD.x + 15, CARD.y + 11.2, CARD.x + 15 + 36 * body, CARD.y + 11.2, stroke, 0.4 * alpha)
  if (detail) {
    // Its close mark.
    const cx = CARD.x + CARD.w - 6
    const cy = CARD.y + 6
    line(cx - 1.1, cy - 1.1, cx + 1.1, cy + 1.1, hair, 0.4 * alpha, 'butt')
    line(cx - 1.1, cy + 1.1, cx + 1.1, cy - 1.1, hair, 0.4 * alpha, 'butt')
  }
  // The timer along its foot: a faint track, and the time gone.
  const shown = front * alpha
  if (shown > 0.01) {
    const left = CARD.x + 5
    const right = CARD.x + CARD.w - 5
    const foot = CARD.y + CARD.h - 2.4
    line(left, foot, right, foot, hair, 0.16 * shown, 'butt')
    if (timer > 0.002) line(left, foot, left + (right - left) * timer, foot, hair * 1.4, 0.6 * shown, 'butt', 'c1')
  }
}

export const scene: Scene = {
  beats: 3,
  still: 0.6,
  draw(pen, t, view) {
    const project = camera({ yaw: 0.36, pitch: -0.24, distance: 200, cx: view.w / 2, cy: view.h / 2 + 4 })
    const hair = 1 / view.px
    const stroke = clamp(view.size * 0.04, 1.5, 3.2) / view.px
    const step = view.ease.emphasized(span(t, 0.08, 0.62))

    // Places from the front (0) back; each toast moves back one place a loop, a new one arriving at the front.
    // Each toast keeps its own clock, a loop earlier for each place it's further back: it writes in as it lands, then its timer runs.
    for (let i = -1; i < PLACES; i++) {
      const place = i + step
      if (place < -1 || place > PLACES) continue
      const rising = clamp(-place)
      const leaving = clamp(place - (PLACES - 1))
      const alpha = (1 - rising) * (1 - leaving) * mix(1, 0.4, clamp(place / (PLACES - 1)))
      if (alpha <= 0.01) continue
      const back = Math.max(place, 0)
      const age = i + 1
      const typed = view.ease.standard(span(t, 0.4 - age, 0.62 - age))
      const timer = span(t, 0.62 - age, 1.08 - age)
      toast(project, 0, -14 + back * STEP_Y - rising * 18, -back * STEP_Z, alpha, hair, stroke, typed, timer, 1 - clamp(place), view.size >= 80)
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Toasts queue up in depth: a new one rises in front as the rest step back and the oldest fades. */
export function LoaderQueue(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
