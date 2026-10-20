'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, mix, polylineLength, span, roundedRect, Depth, projectPath, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'tabstop',
  title: 'Tabstop',
  category: 'interface',
  technique: 'lines',
  tags: ['focus', 'ring', 'keyboard', 'tab', 'form', 'accessibility', 'input'],
  description: 'A focus ring tabs through a form in perspective, from field to field to the checkbox and the button, reshaping to each and sending out a pulse as it lands.',
  order: 2,
  colors: [
    { part: 'Button', mono: 'ink' },
    { part: 'Tick', mono: 'ink', role: 'success' },
  ],
} satisfies LoaderMeta

/* The form is a card in hairlines under its title: two labelled fields, a
 * checkbox and a solid button. The ring is the accent, a little outside each
 * control, and moves in tab order on the `emphasized` curve, taking each
 * control's shape as it goes; on arrival a fainter ring widens and fades. A
 * caret comes up in a focused field, the checkbox ticks as the ring reaches
 * it, the button presses, and the tick clears as the ring tabs back to the
 * top. Four stops make the loop, the last tabbing back to the first, so it
 * has no seam.
 *
 * Color: what the controls say, `c1` the button (the primary
 * action, the theme color), `c2` the checkbox's tick (on: success); both the ink
 * without colors. The ring stays the accent: focus is the brand's. */

type Box = [x: number, y: number, w: number, h: number, r: number]

const CARD: Box = [-36, -31, 72, 62, 4]
const TITLE: Box = [-28, -28.6, 24, 2.8, 1.4]
const LABELS: Box[] = [
  [-28, -24, 15, 2.6, 1.3],
  [-28, -6.5, 20, 2.6, 1.3],
  [-19.5, 14.2, 20, 2.6, 1.3],
]
const FIELDS: Box[] = [
  [-28, -19.5, 56, 9, 2.4],
  [-28, -2, 56, 9, 2.4],
]
const CHECK: Box = [-28, 12.5, 6, 6, 1.5]
const BUTTON: Box = [8, 11, 20, 9, 2.4]
const STOPS: Box[] = [FIELDS[0]!, FIELDS[1]!, CHECK, BUTTON]
const RING = 2.6

const depth = new Depth()
const xy: number[] = []

/** A box on the card (y down, as on screen) projected, its outline lifted `z` off the card. */
function box(project: Project, [x, y, w, h, r]: Box, z = 0) {
  return projectPath(
    roundedRect(x, y, w, h, r, 4).map(([a, b]) => [a, -b, z] as const),
    project,
    xy,
  )
}

export const scene: Scene = {
  beats: 5,
  still: 0.3,
  draw(pen, t, view) {
    const project = camera({ yaw: 0.3 + 0.06 * Math.sin(TAU * t), pitch: -0.2, distance: 280, cx: view.w / 2, cy: view.h / 2 })
    const hair = 1 / view.px
    const stroke = clamp(view.size * 0.02, 1, 1.6) / view.px
    const ring = clamp(view.size * 0.03, 1.5, 2.5) / view.px

    const card = box(project, CARD)
    depth.poly(card.xy, -10, 0.04)
    depth.path(card.xy, -9, { width: hair, alpha: 0.32, closed: true })
    // The form's title, then each control's label.
    const title = box(project, TITLE)
    depth.poly(title.xy, title.z, 0.5)
    for (const label of LABELS) {
      const b = box(project, label)
      depth.poly(b.xy, b.z, 0.3)
    }
    for (const control of [...FIELDS, CHECK]) {
      const b = box(project, control)
      depth.path(b.xy, b.z, { width: stroke, alpha: 0.6, closed: true, join: 'round' })
    }
    // The button is the solid one, its label knocked out of it; it presses as the ring lands on it.
    const press = Math.sin(Math.PI * span(t, 0.84, 0.97))
    const button = box(project, BUTTON)
    depth.poly(button.xy, button.z, 0.78 + 0.17 * press, 'c1', true)
    const label = box(project, [BUTTON[0] + 5, BUTTON[1] + 3.4, BUTTON[2] - 10, 2.2, 1.1])
    depth.poly(label.xy, button.z + 0.01, 0, 'ink', true)

    // The checkbox ticks as the ring lands on it, and clears as the ring tabs back to the top (the form sent).
    const ticked = t < 0.5 ? 1 - view.ease.standard(span(t, 0, 0.08)) : view.ease.standard(span(t, 0.59, 0.66))
    if (ticked > 0.004) {
      const [x, y] = CHECK
      const tick = projectPath(
        [
          [x + 1.4, -(y + 3.1), 0.4],
          [x + 2.6, -(y + 4.4), 0.4],
          [x + 4.7, -(y + 1.6), 0.4],
        ],
        project,
        xy,
      )
      const length = polylineLength(tick.xy)
      depth.path(tick.xy, 40, { width: stroke, alpha: 0.9, tone: 'c2', join: 'round', cap: 'round', dash: [length * ticked, length + 1] })
    }

    // The ring: a quarter of the loop at each stop, the move `emphasized`.
    const quarter = Math.min(3, Math.floor(t * 4))
    const local = t * 4 - quarter
    const move = view.ease.emphasized(span(local, 0, 0.36))
    const from = STOPS[(quarter + 3) % 4]!
    const to = STOPS[quarter]!
    const at: Box = [0, 1, 2, 3, 4].map((i) => mix(from[i]!, to[i]!, move)) as Box
    const focus = box(project, [at[0] - RING, at[1] - RING, at[2] + 2 * RING, at[3] + 2 * RING, at[4] + RING], 1.2)
    depth.path(focus.xy, 100, { width: ring, alpha: 1, closed: true, join: 'round', tone: 'accent' })

    // The pulse on landing.
    const pulse = span(local, 0.36, 0.66)
    if (pulse > 0 && pulse < 1) {
      const grow = RING + mix(0, 5, view.ease.enter(pulse))
      const p = box(project, [to[0] - grow, to[1] - grow, to[2] + 2 * grow, to[3] + 2 * grow, to[4] + grow], 1.2)
      depth.path(p.xy, 99, { width: hair, alpha: 0.6 * (1 - pulse), closed: true, join: 'round', tone: 'accent' })
    }

    // A caret in a focused field: it comes up as the ring lands, and goes as the ring leaves.
    FIELDS.forEach(([x, y, , h], f) => {
      const shown = view.ease.standard(span(t * 4 - f, 0.36, 0.46)) * (1 - view.ease.standard(span(t * 4 - f, 1, 1.1)))
      if (shown < 0.01) return
      const c = projectPath(
        [
          [x + 4, -(y + 2), 0.5],
          [x + 4, -(y + h - 2), 0.5],
        ],
        project,
        xy,
      )
      depth.path(c.xy, 50, { width: stroke, alpha: 0.9 * shown })
    })
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A focus ring tabs through a form in perspective, reshaping to each control and pulsing as it lands. */
export function LoaderTabstop(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
