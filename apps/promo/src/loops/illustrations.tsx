import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { illustrations, sceneViewBox, type IllustrationEntry } from '@youj/illustrations'
import { VOLUME } from '@youj/illustrations/components/youj/graphics/illustrations/kit'
import { derivePalette, formatOklch, PALETTE_TOKENS, internalPresetById, type Palette } from '@youj/core/lib/youj/theme'
import { mixOklab } from '@youj/core/lib/youj/theme/color'
import { mix, tween } from '../lib/timing'
import { useFrame, useFrameValue } from '../sim/simulation'
import { Backdrop } from '../film/backdrop'
import { useFormat, type Format } from '../film/format'
import { paletteVars } from '../film/palette'
import { ILLUSTRATIONS_LOOP as B, TOPICS, type IllustrationsPreset } from './beats'

/* Illustrations, as a loop (beats.ts has the story). Every scene in the
 * registry stands on a plot of one isometric floor: they all frame the same
 * volume, so one floor holds them all, streets between. Each is the real
 * scene, mounted when the ripple reaches its plot and assembling itself as
 * it comes into view, as it does on a page: the parts drop in, far to near,
 * on the settle spring, and its lit part bobs on its own clock.
 *
 * The lens is applied by layout, like the icons loop's: each scene is laid
 * out at its size on screen and draws itself there, so its hairlines stay one
 * pixel at any magnification and a close-up is as crisp as the pull-back.
 *
 * The presets are the library's own derivation (derivePalette), mixed in
 * OKLab per scene as a sweep's line passes under it, so the scenes repaint
 * from the tokens exactly as a theme switch repaints them. */

const P = TOPICS.illustrations.preroll
const COS = Math.cos(Math.PI / 6)
const SIN = 0.5
/** Grid units from one plot to the next: the scenes' shared volume and a street. */
const PITCH = 9
/** The scenes' own unit, and the padding their stage keeps round the volume (IllustrationStage's), in its user units. */
const UNIT = 22
const PAD = 10
const VIEW = sceneViewBox(VOLUME, UNIT, PAD)

/** The scene the loop starts and lands on, and the one that takes its place at the start and comes apart. */
const FIRST = 'home'
const SECOND = 'gift'
/**
 * The scenes nearest the middle, where the camera settles: ones that read at
 * a glance, from as many categories as fit. The rest of the library follows,
 * well mixed, farther out.
 */
const NEAR = [
  'coffee', 'storefront', 'deploy', 'hot-air-balloon', 'globe', 'camera', 'lighthouse', 'idea', 'bicycle', 'database',
  'music', 'plant', 'trophy', 'ship', 'chat', 'telescope', 'game-controller', 'car', 'padlock', 'cake',
  'office-tower', 'sun-cloud', 'guitar', 'dog-house', 'mail', 'pizza', 'wind-turbine', 'suitcase', 'fish-bowl', 'key',
  'film-reel', 'island', 'shopping-bag', 'atom', 'bank', 'tent', 'party', 'books', 'phone', 'solar-panel',
]
/** Plots are (i, j) on the floor. The second scene takes the first's plot; the first lands on the next plot along (below it on the portrait cut, beside it elsewhere). */
const HOME_PLOT = { i: 0, j: 0 }
const lastPlot = (format: Format) => (format.tall ? { i: 1, j: 1 } : { i: 1, j: -1 })

/** A floor point on screen, in grid units before the lens: x right, y down. */
const onFloor = (x: number, y: number) => ({ x: (x - y) * COS, y: (x + y) * SIN })
/** A plot's volume, centred: the middle of its floor, raised half the volume's height. */
const centreOf = ({ i, j }: { i: number; j: number }) => {
  const p = onFloor(i * PITCH + VOLUME[0] / 2, j * PITCH + VOLUME[1] / 2)
  return { x: p.x, y: p.y - VOLUME[2] / 2 }
}
/** Plots apart, in plot widths on screen. */
const PLOT_WIDTH = 2 * PITCH * COS
const apart = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) / PLOT_WIDTH

/* ── The lens: a point shown at the frame's centre, `g` px per grid unit ── */

interface Lens {
  g: number
  x: number
  y: number
}

/* ── The floor's plots ─────────────────────────────────────────────────── */

interface Plot {
  i: number
  j: number
  entry: IllustrationEntry
  /** Its volume's centre on screen, grid units before the lens. */
  centre: { x: number; y: number }
  /** When the ripple reaches it, in the loop's frames. */
  arrives: number
  /** The plot the loop lands on: it stays as the rest of the library fades. */
  stays: boolean
}

interface Layout {
  plots: Plot[]
  /** px per grid unit at macro and pulled back. */
  macro: number
  wide: number
  /** The first plot's volume and the last's: the camera travels from one to the other. */
  first: { x: number; y: number }
  last: { x: number; y: number }
}

/** The close-up: the scene's volume about two thirds of the frame's height (portrait, about two thirds of its width; on the strip, as much as the narrowest tile holds). */
function macroOf(format: Format) {
  if (format.tile) return 34
  if (format.tall) return 44
  return 50
}

/** How much closer the camera leans while the present assembles and comes apart: it sits lower in its volume than most. */
const LEAN = 1.18

/** Pulled back: a few dozen scenes in frame, each still one you can name (on the strip, a close crop of them). */
function wideOf(format: Format) {
  if (format.tile) return 14
  if (format.tall) return 19.5
  return 21
}

function layoutFor(format: Format): Layout {
  const { width, height } = format
  const LAST_PLOT = lastPlot(format)
  const first = centreOf(HOME_PLOT)
  const last = centreOf(LAST_PLOT)
  const mid = { x: (first.x + last.x) / 2, y: (first.y + last.y) / 2 }
  // Plots nearest the wide shot's centre first, in the frame's own proportions, so the library fills it to the edges.
  const reach = (c: { x: number; y: number }) => Math.max(Math.abs(c.x - mid.x) / (width / 2), Math.abs(c.y - mid.y) / (height / 2))
  const around: { i: number; j: number; centre: { x: number; y: number }; d: number }[] = []
  for (let i = -18; i <= 18; i++) {
    for (let j = -18; j <= 18; j++) {
      const centre = centreOf({ i, j })
      around.push({ i, j, centre, d: reach(centre) })
    }
  }
  around.sort((a, b) => a.d - b.d || a.centre.y - b.centre.y || a.centre.x - b.centre.x)
  const n = illustrations.length
  const taken = around.slice(0, n)
  const byId = (id: string): IllustrationEntry => illustrations.find((s) => s.id === id)!
  // The scenes that read at a glance nearest the middle, then every other scene once, in a stable, well-mixed order.
  const near = NEAR.map(byId).filter(Boolean)
  const rest = [
    ...near,
    ...illustrations
      .filter((s) => s.id !== FIRST && s.id !== SECOND && !NEAR.includes(s.id))
      .map((entry, i, all) => ({ entry, key: (i * 7919) % all.length }))
      .sort((a, b) => a.key - b.key)
      .map(({ entry }) => entry),
  ]
  const is = (p: { i: number; j: number }, q: { i: number; j: number }) => p.i === q.i && p.j === q.j
  let next = 0
  const plots: Plot[] = taken.map(({ i, j, centre }) => {
    const entry = is({ i, j }, HOME_PLOT) ? byId(SECOND) : is({ i, j }, LAST_PLOT) ? byId(FIRST) : rest[next++]!
    // The last plot arrives at its own beat wherever it is, so its bob matches the first scene's when the loop comes round (beats.ts).
    const arrives = is({ i, j }, HOME_PLOT) ? B.swap : is({ i, j }, LAST_PLOT) ? B.landing : B.wave + apart(centre, first) * B.ring
    return { i, j, entry, centre, arrives, stays: is({ i, j }, LAST_PLOT) }
  })
  // Painter's order: far plots first.
  plots.sort((a, b) => a.i + a.j - (b.i + b.j) || a.i - a.j - (b.i - b.j))
  return { plots, macro: macroOf(format), wide: wideOf(format), first, last }
}

/**
 * The camera: it leans in as the present assembles, pulls back from the
 * first plot to between it and the last, holds there while the lines sweep
 * the floor (still, so every scene can be read as it changes), and pushes in
 * to the last. Zooms move in log scale, so they read at an even rate.
 */
function lensAt(f: number, layout: Layout): Lens {
  const lean = tween(f, P + B.swap, B.apart - B.swap, 'standard')
  const out = tween(f, P + B.pull, B.pullLength, 'emphasized')
  const back = tween(f, P + B.push, B.pushLength, 'emphasized')
  const log = Math.log
  const zoom = Math.exp(mix(mix(mix(log(layout.macro), log(layout.macro * LEAN), lean), log(layout.wide), out), log(layout.macro), back))
  const between = { x: (layout.first.x + layout.last.x) / 2, y: (layout.first.y + layout.last.y) / 2 }
  return { g: zoom, x: mix(mix(layout.first.x, between.x, out), layout.last.x, back), y: mix(mix(layout.first.y, between.y, out), layout.last.y, back) }
}

/* ── The presets, as the library derives them ──────────────────────────── */

type Scheme = 'dark' | 'light'
const palettes = new Map<string, Palette>()
const paletteOf = (preset: IllustrationsPreset, scheme: Scheme) => {
  const key = `${preset}-${scheme}`
  if (!palettes.has(key)) palettes.set(key, derivePalette(internalPresetById(preset), scheme))
  return palettes.get(key)!
}
const pure = new Map<string, CSSProperties>()
const varsOf = (preset: IllustrationsPreset, scheme: Scheme) => {
  const key = `${preset}-${scheme}`
  if (!pure.has(key)) pure.set(key, paletteVars(paletteOf(preset, scheme)))
  return pure.get(key)!
}
const mixPalettes = (a: Palette, b: Palette, t: number) => Object.fromEntries(PALETTE_TOKENS.map((k) => [k, mixOklab(b[k], a[k], t)])) as Palette

/** How far a sweep's line has carried its preset across a floor point (0 before it, 1 once passed), given the line's position. */
const SOFT = 5
const passed = (line: number, x: number) => Math.min(1, Math.max(0, (line - x) / SOFT + 0.5))

/* ── The scene ─────────────────────────────────────────────────────────── */

export function IllustrationsLoop() {
  const frame = useFrame()
  const format = useFormat()
  const { width, height } = format
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  const layout = useMemo(() => layoutFor(format), [format.width, format.height])
  const scheme: Scheme = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  const lens = lensAt(frame, layout)
  const cx = width / 2
  const cy = height / 2
  const toScreen = (p: { x: number; y: number }) => ({ x: cx + (p.x - lens.x) * lens.g, y: cy + (p.y - lens.y) * lens.g })

  /** A scene's box on screen with its floor's origin at floor point (x, y), or null when it's out of frame. */
  const boxAt = (x: number, y: number): CSSProperties | null => {
    const o = toScreen(onFloor(x, y))
    const k = lens.g / UNIT
    const box = { left: o.x + VIEW.x * k, top: o.y + VIEW.y * k, width: VIEW.width * k, height: VIEW.height * k }
    const margin = 24
    if (box.left > width + margin || box.top > height + margin || box.left + box.width < -margin || box.top + box.height < -margin) return null
    return box
  }

  // Where each sweep's line is on the floor: it crosses the floor in frame, far corner to near.
  const span = floorSpan(lensAt(P + B.sweeps[0]!.at, layout), width, height)
  const lines = B.sweeps.map((s) => ({ ...s, x: mix(span.x0 - 6, span.x1 + 6, (frame - P - s.at) / B.sweepLength) }))
  const themed = (x: number) => {
    let palette: Palette | null = null
    let settled: IllustrationsPreset = 'basalt'
    for (const line of lines) {
      const t = passed(line.x, x)
      if (t >= 1) {
        palette = null
        settled = line.preset
      } else if (t > 0) {
        palette = mixPalettes(palette ?? paletteOf(settled, scheme), paletteOf(line.preset, scheme), t)
      }
    }
    return palette ? paletteVars(palette) : varsOf(settled, scheme)
  }

  // The scenes, made once: the camera moves their boxes, never them. The present on the first plot is made again as it comes apart and closes.
  // biome-ignore lint/correctness/useJsxKeyInIterable: map entries are [plot, element] pairs for a Map, not rendered children
  const scenes = useMemo(() => new Map(layout.plots.map((p) => [p, <p.entry.Component grow unit={UNIT} />])), [layout])
  const apart = useFrameValue((f) => f >= P + B.apart && f < P + B.together)
  const present = useMemo(() => {
    const { Component } = illustrations.find((s) => s.id === SECOND)!
    return <Component grow unit={UNIT} explode={apart ? 1 : 0} />
  }, [apart])
  const opening = useMemo(() => {
    const { Component } = illustrations.find((s) => s.id === FIRST)!
    return <Component grow unit={UNIT} />
  }, [])

  const leaving = tween(frame, P + B.giveWay, 'slow', 'exit')
  const crowd = 1 - tween(frame, P + B.clear, B.clearLength, 'standard')
  const openingBox = leaving < 1 ? boxAt(HOME_PLOT.i * PITCH, HOME_PLOT.j * PITCH) : null
  // The unit grid is for the close-ups; pulled back it would be a haze of lines.
  const minor = Math.min(1, Math.max(0, (lens.g - 28) / 16))
  // The glow behind the middle of the frame is in the accent of whatever preset the middle is in.
  const middle = (lens.x / COS + lens.y / SIN) / 2
  const glow = { '--color-accent': (themed(middle) as Record<string, string>)['--color-accent'] } as CSSProperties

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0" style={glow}>
        <Backdrop grid={0} glow={0.28} glowAt={{ x: 50, y: 48 }} />
      </div>
      <div className="absolute inset-0" style={{ maskImage: 'radial-gradient(ellipse 80% 84% at 50% 50%, black 56%, transparent 100%)' }}>
        <Floor lens={lens} width={width} height={height} minor={minor} lines={lines.map((l) => ({ x: l.x, accent: formatOklch(paletteOf(l.preset, scheme).accent) }))} />
        {openingBox && (
          <Place box={openingBox} vars={varsOf('basalt', scheme)} show={1 - leaving} rise={leaving * lens.g * 0.4}>
            {opening}
          </Place>
        )}
        {layout.plots.map((plot) => {
          const show = plot.stays ? 1 : crowd
          if (frame < P + plot.arrives || show <= 0) return null
          const box = boxAt(plot.i * PITCH, plot.j * PITCH)
          if (!box) return null
          return (
            <Place key={plot.entry.id} box={box} vars={themed(plot.i * PITCH + VOLUME[0] / 2)} show={show}>
              {plot.entry.id === SECOND ? present : scenes.get(plot)}
            </Place>
          )
        })}
      </div>
    </div>
  )
}

/** A scene in its box, in its palette. What it holds is made once and never re-rendered here. */
function Place({ box, vars, show, rise = 0, children }: { box: CSSProperties; vars: CSSProperties; show: number; rise?: number; children: ReactNode }) {
  return <div className="absolute" style={{ ...box, ...vars, opacity: show, transform: rise ? `translateY(${-rise}px)` : undefined }}>{children}</div>
}

/* ── The floor ─────────────────────────────────────────────────────────── */

/** The floor's extent in frame through a lens: its x and y ranges, in grid units. */
function floorSpan(lens: Lens, width: number, height: number) {
  const corners = [
    [0, 0],
    [width, 0],
    [0, height],
    [width, height],
  ].map(([sx, sy]) => {
    const u = (sx! - width / 2) / lens.g + lens.x
    const v = (sy! - height / 2) / lens.g + lens.y
    return { x: (u / COS + v / SIN) / 2, y: (v / SIN - u / COS) / 2 }
  })
  return {
    x0: Math.min(...corners.map((c) => c.x)),
    x1: Math.max(...corners.map((c) => c.x)),
    y0: Math.min(...corners.map((c) => c.y)),
    y1: Math.max(...corners.map((c) => c.y)),
  }
}

/**
 * The drafting floor under the plots: a line every grid unit (only while
 * the camera is close enough to read it) and a stronger one down each
 * street. The sweeps' lines run along it, under the scenes.
 */
function Floor({ lens, width, height, minor, lines }: { lens: Lens; width: number; height: number; minor: number; lines: { x: number; accent: string }[] }) {
  const span = floorSpan(lens, width, height)
  const at = (x: number, y: number) => {
    const p = onFloor(x, y)
    return [width / 2 + (p.x - lens.x) * lens.g, height / 2 + (p.y - lens.y) * lens.g] as const
  }
  const seg = (x0: number, y0: number, x1: number, y1: number) => {
    const [a, b] = at(x0, y0)
    const [c, d] = at(x1, y1)
    return `M${a.toFixed(2)} ${b.toFixed(2)}L${c.toFixed(2)} ${d.toFixed(2)}`
  }
  const units = (from: number, to: number, step: number, offset = 0) => {
    const out: number[] = []
    for (let v = Math.ceil((from - offset) / step) * step + offset; v <= to; v += step) out.push(v)
    return out
  }
  const grid = (step: number, offset: number) =>
    [...units(span.x0, span.x1, step, offset).map((x) => seg(x, span.y0, x, span.y1)), ...units(span.y0, span.y1, step, offset).map((y) => seg(span.x0, y, span.x1, y))].join('')
  return (
    <svg aria-hidden className="absolute inset-0" width={width} height={height} fill="none">
      {minor > 0 && <path d={grid(1, 0)} stroke="color-mix(in oklab, var(--color-fg) 9%, transparent)" strokeWidth={1} opacity={minor} />}
      <path d={grid(PITCH, -0.5)} stroke="color-mix(in oklab, var(--color-fg) 15%, transparent)" strokeWidth={1} />
      {lines
        .filter((l) => l.x > span.x0 - 8 && l.x < span.x1 + 8)
        .map((l, i) => (
          <g key={i}>
            <path d={seg(l.x, span.y0, l.x, span.y1)} stroke={l.accent} strokeWidth={14} opacity={0.3} style={{ filter: 'blur(8px)' }} />
            <path d={seg(l.x, span.y0, l.x, span.y1)} stroke={l.accent} strokeWidth={2} />
          </g>
        ))}
    </svg>
  )
}
