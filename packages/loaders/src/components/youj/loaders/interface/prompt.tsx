'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, blend, camera, clamp, mix, polylineLength, span, roundedRect, Depth, projectPath, type Project, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'prompt',
  title: 'Prompt',
  category: 'interface',
  technique: 'lines',
  tags: ['terminal', 'caret', 'cli', 'typing', 'command', 'console', 'output'],
  description: 'A terminal in perspective: the caret, the brand’s square in the accent, types a command, its output prints and checks off, and the screen scrolls up for the next prompt.',
  order: 4,
  colors: [
    { part: 'Prompt', mono: 'ink' },
    { part: 'Check', mono: 'accent', role: 'success' },
  ],
} satisfies LoaderMeta

/* The window is a hairline frame with the tittle in its header. Text is
 * drawn as the shapes of monospaced words, not glyphs, so it reads at any
 * size: a chevron, then the command typed a character at a time behind a
 * block caret in the accent, which blinks when it waits. On enter, two
 * lines of output stream out left to right, the last ending in a check
 * that draws on, and the screen scrolls up a block (`emphasized`), an
 * overlay scrollbar showing while it moves, leaving a fresh prompt exactly
 * where the loop began.
 *
 * Color: like a shell's, `c1` the prompt's chevron, and each line of
 * output arriving in it and settling to the ink (the theme color; the ink in
 * no colors), `c2` the check (success; the accent without colors). The
 * caret stays the accent. */

/** A block of the session: the command, then its output; each number is a word's length in characters. */
const COMMAND = [2, 4]
const OUTPUT = [
  [5, 3, 6, 2],
  [4, 7],
]
const CHAR = 2.4
const GAP = 0.9
const LINE = 7
const BLOCK = LINE * 3
const LEFT = -32
const TOP = 15
const BOTTOM = -27

const depth = new Depth()
const xy: number[] = []

/** A rectangle on the window's face, projected. */
function rect(project: Project, x: number, y: number, w: number, h: number) {
  return projectPath(
    [
      [x, y, 0],
      [x + w, y, 0],
      [x + w, y - h, 0],
      [x, y - h, 0],
    ],
    project,
    xy,
  )
}

/** The characters of a line of words, as cells along it: each cell's x. */
function cells(words: number[], from: number) {
  const out: number[] = []
  let x = from
  for (const word of words) {
    for (let c = 0; c < word; c++) out.push(x + c * (CHAR + GAP))
    x += (word + 1) * (CHAR + GAP)
  }
  return out
}

const TYPED = cells(COMMAND, LEFT + 6)
const PRINTED = OUTPUT.map((words) => cells(words, LEFT))

export const scene: Scene = {
  beats: 5.5,
  still: 0.3,
  draw(pen, t, view) {
    const project = camera({ yaw: -0.3 + 0.05 * Math.sin(TAU * t), pitch: -0.16, distance: 280, cx: view.w / 2, cy: view.h / 2 })
    const hair = 1 / view.px
    const stroke = clamp(view.size * 0.02, 1, 1.6) / view.px

    const frame = projectPath(
      roundedRect(-40, -31, 80, 62, 3, 3).map(([x, y]) => [x, y, 0] as const),
      project,
      xy,
    )
    depth.poly(frame.xy, -10, 0.05)
    depth.path(frame.xy, -9, { width: hair, alpha: 0.42, closed: true })
    const rule = projectPath(
      [
        [-40, 22, 0],
        [40, 22, 0],
      ],
      project,
      xy,
    )
    depth.path(rule.xy, -9, { width: hair, alpha: 0.3 })
    const tittle = rect(project, LEFT, 28, 2.6, 2.6)
    depth.poly(tittle.xy, -8, 1, 'accent')
    const title = rect(project, LEFT + 5, 27.8, 16, 2.2)
    depth.poly(title.xy, -8, 0.25)

    // Typing (a key at a time: a deliberate rhythm), then the output streaming out line by line, the check drawing on, and the scroll that makes room.
    const typed = Math.floor(span(t, 0.08, 0.42) * TYPED.length + 1e-6)
    const entered = t >= 0.46
    const stream = [view.ease.standard(span(t, 0.48, 0.55)), view.ease.standard(span(t, 0.55, 0.63))]
    const checked = view.ease.standard(span(t, 0.62, 0.69))
    const travel = view.ease.emphasized(span(t, 0.7, 0.9))
    const scroll = travel * BLOCK

    // Lines fade in the bands just under the header and over the window's foot, so text scrolls through without a cut.
    const fade = (y: number) => (1 - span(y, TOP - 4, TOP + 2)) * span(y, BOTTOM, BOTTOM + 3)
    const glyph = (x: number, y: number, alpha: number, tone: Tone = 'ink', w = CHAR) => {
      const a = alpha * fade(y)
      if (a <= 0.01) return
      const r = rect(project, x, y, w, 3)
      depth.poly(r.xy, 1, a, tone)
    }
    const chevron = (y: number, alpha: number) => {
      const a = alpha * fade(y)
      if (a <= 0.01) return
      const c = projectPath(
        [
          [LEFT, y, 0],
          [LEFT + 2.4, y - 1.5, 0],
          [LEFT, y - 3, 0],
        ],
        project,
        xy,
      )
      depth.path(c.xy, 2, { width: stroke, alpha: a, join: 'miter', tone: 'c1' })
    }

    // The next prompt (index -1), rising into place as the screen scrolls; the block being written (0); the finished ones above.
    for (let b = -1; b < 3; b++) {
      const base = -8 + b * BLOCK + scroll
      const done = b > 0
      chevron(base, 0.9)
      if (b < 0) continue
      TYPED.forEach((x, i) => {
        if (done || i < typed) glyph(x, base, 0.9)
      })
      OUTPUT.forEach((_, line) => {
        // Each line streams out left to right: a glyph comes up as the front passes over it.
        const cells = PRINTED[line]!
        const front = done ? Infinity : mix(LEFT - CHAR, cells.at(-1)! + CHAR + GAP, stream[line]!)
        // A glyph comes up in the prompt's color and settles to the ink a few cells behind the front.
        cells.forEach((x) => glyph(x, base - LINE * (line + 1), 0.5 * clamp((front - x) / (CHAR + GAP)), blend('c1', 'ink', clamp((front - x) / (CHAR + GAP) / 5))))
      })
      const draw = done ? 1 : checked
      if (draw > 0.004) {
        const y = base - LINE * 2
        const end = PRINTED[1]!.at(-1)! + CHAR + GAP * 2 + 1
        const check = projectPath(
          [
            [end, y - 1.6, 0],
            [end + 1.1, y - 2.8, 0],
            [end + 3.2, y - 0.2, 0],
          ],
          project,
          xy,
        )
        const a = fade(y)
        const length = polylineLength(check.xy)
        if (a > 0.01) depth.path(check.xy, 3, { width: stroke, alpha: a, tone: 'c2', join: 'round', cap: 'round', dash: [length * draw, length + 1] })
      }
    }

    // An overlay scrollbar: it shows while the screen scrolls, its thumb riding down the track, and fades once it's still.
    const bar = view.ease.standard(span(t, 0.66, 0.72)) * (1 - view.ease.standard(span(t, 0.9, 0.97)))
    if (view.size >= 40 && bar > 0.01) {
      const track = projectPath(
        [
          [37, 19, 0],
          [37, -28, 0],
        ],
        project,
        xy,
      )
      depth.path(track.xy, 4, { width: hair, alpha: 0.14 * bar })
      const thumb = projectPath(
        [
          [37, -12 - 4 * travel, 0],
          [37, -21 - 4 * travel, 0],
        ],
        project,
        xy,
      )
      depth.path(thumb.xy, 5, { width: stroke * 1.5, alpha: 0.5 * bar, cap: 'round' })
    }

    // The caret: after what's typed, blinking while it waits; at the fresh prompt once the screen has scrolled.
    const waiting = t < 0.08 || t > 0.9
    const caretY = t > 0.9 ? -8 : -8 + scroll
    const caretX = entered && t <= 0.9 ? null : t > 0.9 ? TYPED[0]! : TYPED[Math.min(typed, TYPED.length - 1)]! + (typed >= TYPED.length ? CHAR + GAP : 0)
    const blink = waiting ? (Math.floor(t * 6) % 2 === 0 ? 1 : 0) : 1
    if (caretX !== null && blink) glyph(caretX, caretY, 1, 'accent', CHAR)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A terminal types a command behind an accent caret, prints its output, and scrolls for the next prompt. */
export function LoaderPrompt(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
