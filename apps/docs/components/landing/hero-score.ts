import { easings } from '@youj/core'
import type { PillarId } from '@/lib/nav'

/* The home hero's score: the release card coming apart into the family's tiles over the pinned scroll. Progress runs
 * 0 to 1 over the pinned stretch of the track; every beat is a range of it. One set of elements: each is the card's
 * piece at rest and travels, scaled, to its tile, whose frame and label fade in round it; the card's frame shrinks into
 * Blocks. The browser plays it on the scroll itself (a view timeline on the track), so nothing here runs per frame: the
 * stage measures where each element rests and where it lands once per layout, and writes it all into one stylesheet of
 * keyframes. Only transform (translate, scale) and opacity move. */

/** Wide and tall enough to pin the stage with the whole grid in view; the `hero-pin` variant (app/tailwind.css) is the same. */
export const HERO_PIN_QUERY = '(min-width: 1280px) and (min-height: 860px) and (prefers-reduced-motion: no-preference)'

export type ElementId = Exclude<PillarId, 'blocks'>
export const ELEMENTS: ElementId[] = ['ui', 'motion', 'loaders', 'icons', 'illustrations', 'sound', 'themes']

type Range = readonly [number, number]

/** The copy gives way first. */
export const COPY_OUT: Range = [0, 0.07]
/** The frame leaves first, from under the parts while they hold still, so nothing ever flies over it: it shrinks into Blocks. */
export const FRAME: Range = [0.04, 0.24]
/** When each part leaves, outward, each clear of the next one's path. The left column (the alerts, the rack) goes as the
 *  frame retracts away from it; then the toolbar, the notification and the right column (the appearance panel down, the
 *  curve up once the toolbar has passed over it); and the tree last, through the middle to where the right column was. */
const LEAVES: Record<ElementId, number> = { ui: 0.12, illustrations: 0.15, icons: 0.17, sound: 0.19, themes: 0.21, motion: 0.23, loaders: 0.27 }
/** How far an element bows off its straight path at its middle (px, up when negative): the toolbar, out of the card's
 *  bar, goes over the rollout curve rather than through it, before the curve rises to its tile. */
const BOW: Partial<Record<ElementId, number>> = { icons: -56 }
const FLIGHT = 0.22
export function travel(id: PillarId): Range {
  if (id === 'blocks') return FRAME
  return [LEAVES[id], LEAVES[id] + FLIGHT]
}
/** Each tile's frame and label fade in round its part as it settles. */
export function fadeIn(id: PillarId): Range {
  const end = travel(id)[1]
  return [end - 0.04, end + 0.05]
}
/** Where each part lands, in order: the rail's ticks. */
export const LANDINGS = [...ELEMENTS, 'blocks' as const].map((id) => travel(id)[1]).sort((a, b) => a - b)

/** The section's heading comes in as the last tiles do. */
export const HEADING_IN: Range = [0.46, 0.58]
/** From here the grid is the family section: its links take the pointer. The rest of the track holds it. */
export const LANDED = 0.6

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** One element's flight: where it rests (its box in the stage, and the scale it rests at) and the room its tile gives it. */
export interface Flight {
  id: PillarId
  /** The element's layout box in the stage, at its natural size (the card scales it by `rest`). */
  from: Box
  rest: number
  /** Its tile's picture area, in the stage. */
  room: Box
}

/** How much of its tile's room an element may take, and how far it may grow. Banyan is fitted by its tree, which fills
 *  about two thirds of its square's height; the frame takes nearly the whole tile, as a page's layout. */
const FILL: Record<PillarId, { fill: number; max: number; tall?: number }> = {
  ui: { fill: 0.86, max: 1.5 },
  motion: { fill: 0.86, max: 1.2 },
  loaders: { fill: 1, max: 1.3, tall: 0.7 },
  icons: { fill: 0.86, max: 1.25 },
  illustrations: { fill: 0.96, max: 1.2 },
  sound: { fill: 0.9, max: 1.25 },
  themes: { fill: 0.86, max: 1.25 },
  blocks: { fill: 0.94, max: 1 },
}

/** Where an element lands: scaled to fit its tile's room, centered. */
export function land(id: PillarId, size: { w: number; h: number }, room: Box): Box {
  const { fill, max, tall = 1 } = FILL[id]
  const k = Math.min(max, (room.w * fill) / size.w, (room.h * fill) / (size.h * tall))
  const w = size.w * k
  const h = size.h * k
  return { x: room.x + (room.w - w) / 2, y: room.y + (room.h - h) / 2, w, h }
}

const bezier = (e: readonly number[]) => `cubic-bezier(${e.join(',')})`
const TRAVEL_EASE = bezier(easings.emphasized)
const OPEN_EASE = bezier(easings.enter)
const FADE_EASE = bezier(easings.standard)
/* The score's times run to LANDED and then hold. The track is cut to the transition plus a short hold, so the score
 * plays over the first 1/HOLD_SQUEEZE of the timeline at the same pace, and the film follows soon after it lands. */
export const HOLD_SQUEEZE = 1.5
const pct = (p: number) => `${+(Math.min(1, p * HOLD_SQUEEZE) * 100).toFixed(2)}%`
const px = (n: number) => `${+n.toFixed(2)}px`

/** Keyframes as [progress, declarations, the ease to the next], held before the first and after the last. */
function keyframes(name: string, given: [number, string, string?][]) {
  const first = given[0]!
  const last = given[given.length - 1]!
  // A missing end would ease back to the element's own style.
  const frames: [number, string, string?][] = [...(first[0] > 0 ? [[0, first[1]] as [number, string]] : []), ...given, ...(last[0] < 1 ? [[1, last[1]] as [number, string]] : [])]
  const steps = frames.map(([p, css, ease]) => `${pct(p)}{${css}${ease ? `;animation-timing-function:${ease}` : ''}}`)
  return `@keyframes ${name}{${steps.join('')}}`
}

/** Plays `names` on `selector`, paused for the stage to seek (the timeline takes over below where there's one). Only once
 *  the card starts to come apart: at rest nothing is attached. */
const play = (selector: string, names: string[]) => `${selector}{animation:${names.map((name) => `${name} 1000ms linear both paused`).join(',')}}`
const SCOPE = '.ho[data-apart] '

/** The stylesheet for one layout: every element's flight to its tile, the tiles fading in round them, the frame into
 *  Blocks, and the copy and heading. */
/* While it comes apart the scene rides up by `lift` px and stays there, so the parts and the grid they land in sit in
 * the middle of the screen, not at its foot. (The stage pulls the next section up under the grid, so no gap opens.) */
const LIFT: [number, number] = [0.08, 0.36]

export function heroSheet(flights: Flight[], lift = 0): string {
  const rules: string[] = []
  const animated = new Map<string, string[]>()
  const add = (selector: string, name: string, frames: [number, string, string?][]) => {
    rules.push(keyframes(name, frames))
    animated.set(SCOPE + selector, [...(animated.get(SCOPE + selector) ?? []), name])
  }

  add('.ho-copy', 'ho-copy', [
    [COPY_OUT[0], 'opacity:1;translate:0 0', FADE_EASE],
    [COPY_OUT[1], 'opacity:0;translate:0 -24px'],
  ])
  if (lift > 0)
    add('.ho-lift', 'ho-lift', [
      [LIFT[0], 'translate:0 0', TRAVEL_EASE],
      [LIFT[1], `translate:0 ${px(-lift)}`],
      [1, `translate:0 ${px(-lift)}`],
    ])
  add('.ho-heading', 'ho-heading', [
    [HEADING_IN[0], 'opacity:0;translate:0 12px', OPEN_EASE],
    [HEADING_IN[1], 'opacity:1;translate:0 0'],
  ])

  // As the frame steps out from under its parts, its panels turn into a template's dashed slots.
  add('.ho-card .ho-well', 'ho-wells', [
    [FRAME[0] + 0.02, 'opacity:0', FADE_EASE],
    [FRAME[0] + 0.1, 'opacity:1'],
  ])
  for (const { id, from, rest, room } of flights) {
    const to = land(id, from, room)
    const k = to.w / from.w
    const [t0, t1] = travel(id)
    add(`[data-el=${id}]`, `ho-f-${id}`, [
      [t0, `translate:0 0;scale:${rest}`, TRAVEL_EASE],
      [t1, `translate:${px(to.x - from.x)} ${px(to.y - from.y)};scale:${+k.toFixed(4)}`],
    ])
    const bow = id === 'blocks' ? undefined : BOW[id]
    // The bow is its own animation on transform, eased out and back in over the flight, so the path curves.
    if (bow)
      add(`[data-el=${id}]`, `ho-b-${id}`, [
        [t0, 'transform:none', OPEN_EASE],
        [(t0 + t1) / 2, `transform:translateY(${bow}px)`, FADE_EASE],
        [t1, 'transform:none'],
      ])
    const [f0, f1] = fadeIn(id)
    add(`[data-tile=${id}]`, `ho-t-${id}`, [
      [f0, 'opacity:0', FADE_EASE],
      [f1, 'opacity:1'],
    ])
  }

  // The rail fills with the scroll, lights each part's tick with a small bump as the part lands, completes with a
  // pulse, then fades.
  add('.ho-rail', 'ho-rail', [
    [0.01, 'opacity:0', FADE_EASE],
    [0.05, 'opacity:1'],
    [LANDED + 0.04, 'opacity:1', FADE_EASE],
    [LANDED + 0.1, 'opacity:0'],
  ])
  add('.ho-rail-fill', 'ho-rail-fill', [
    [0, 'scale:1 0'],
    [LANDED, 'scale:1 1'],
  ])
  LANDINGS.forEach((at, i) =>
    add(`.ho-rail-tick[data-tick='${i}']`, `ho-tick-${i}`, [
      [at - 0.008, 'opacity:0;scale:1 1', OPEN_EASE],
      [at, 'opacity:1;scale:1.8 1.6', FADE_EASE],
      [at + 0.02, 'opacity:1;scale:1 1'],
    ]),
  )
  add('.ho-rail-done', 'ho-rail-done', [
    [LANDED - 0.006, 'opacity:0;scale:0.4', OPEN_EASE],
    [LANDED + 0.008, 'opacity:1;scale:1.8', FADE_EASE],
    [LANDED + 0.03, 'opacity:1;scale:1'],
  ])

  for (const [selector, names] of animated) rules.push(play(selector, names))
  // (not while the card builds itself, which holds the parts at rest: hero-build.ts, and hero-stage.tsx eases them to the scroll)
  const timeline = `@supports (animation-timeline: view()){${[...animated.keys()].map((k) => `:root:not([data-hero-building]) ${k}`).join(',')}{animation-play-state:running;animation-duration:auto;animation-timeline:--ho;animation-range:contain 0% contain 100%}}`
  return `@media ${HERO_PIN_QUERY}{${rules.join('')}${timeline}}`
}
