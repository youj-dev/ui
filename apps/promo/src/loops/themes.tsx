import { memo, useMemo, type CSSProperties, type ReactNode } from 'react'
import { defineTheme, YoujProvider, ThemeScope, type YoujLook, type ThemeInput } from '@youj/core'
import { composeTheme, paletteById, styleById } from '@youj/core/lib/youj/theme'
import { CloudIcon, SearchIcon } from '@youj/icons'
import { derivePalette, formatOklch } from '@youj/core/lib/youj/theme'
import { UsageOverview } from '@youj/react/blocks/app/usage-overview'
import { Avatar, AvatarFallback } from '@youj/react/components/ui/avatar'
import { Badge } from '@youj/react/components/ui/badge'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@youj/react/components/ui/input-group'
import { Tabs, TabsList, TabsTrigger } from '@youj/react/components/ui/tabs'
import { mix, tween } from '../lib/timing'
import { useAction, useFrame, useFrameValue } from '../sim/simulation'
import { Backdrop } from '../film/backdrop'
import { Camera } from '../film/camera'
import { Cursor } from '../film/cursor'
import { useFormat, type Format } from '../film/format'
import { THEMES_HOME, THEMES_LOOP as T, THEMES_TARGET, TOPICS, type ThemesLayer, type ThemesPalette } from './beats'

/* Themes, as a loop (beats.ts has the story). The product is the registry's
 * Usage & billing block under an app bar (Tabs, a search field, a badge, an
 * avatar), exactly as it ships, laid out at a laptop's viewport and scaled
 * into a panel. Every region between two lines is a copy of it in its own
 * ThemeScope, mode and style, masked to that region, so what a line leaves
 * behind is the same screen with one more thing changed. Nothing is
 * recoloured by hand: each copy is the theme engine's own output for its
 * theme, a palette in a style, or Youj in Bezel with some of Cinnabar in
 * Brutal's fields.
 *
 * The copies are worked together: the pointer's presses go to every copy in
 * the page at the same frame, so they agree wherever a line splits them, and
 * a frame moves only their masks, the lines and the camera. */

const P = TOPICS.themes.preroll

type Scheme = 'dark' | 'light'

interface Look {
  theme: ThemeInput
  scheme: Scheme
  style: YoujLook
}

/** The theme's fields each layer carries from Youj in Bezel to the target (the style's look is the ThemeScope's own prop). A palette is the colour and chart layers; a style is the rest. */
const LAYER_FIELDS: Record<Exclude<ThemesLayer, 'style'>, (keyof ThemeInput)[]> = {
  colour: ['neutral', 'accent', 'success', 'warning', 'danger', 'info'],
  chart: ['chart'],
  shape: ['radius', 'controlSize'],
  type: ['fonts', 'headings', 'labels'],
  depth: ['stroke', 'shadow', 'surfaces'],
}
const STYLE_LAYER_FIELDS: (keyof ThemeInput)[] = ['actions', 'controls', 'motionPersonality']

/** What each line is called as it crosses. */
const LAYER_NAMES: Record<ThemesLayer, string> = {
  colour: 'Colour',
  chart: 'Chart',
  shape: 'Radius & density',
  type: 'Type',
  depth: 'Stroke & shadow',
  style: 'Style',
}

const LAYERS = T.layers.length

/** A palette in a style, as the theme and the look its ThemeScope wears. */
function lookOf(pair: { palette: string; style: string }, scheme: Scheme): Look {
  const style = styleById(pair.style)
  return { theme: composeTheme(paletteById(pair.palette), style), scheme, style: style.look }
}

/** Youj in Bezel with the first `k` layers of the target: the look behind the k-th line. With every layer it is the target, Cinnabar in Brutal. */
function layered(k: number, scheme: Scheme): Look {
  if (k === 0) return lookOf(THEMES_HOME, scheme)
  if (k === LAYERS) return lookOf(THEMES_TARGET, scheme)
  const home = lookOf(THEMES_HOME, scheme).theme
  const target = lookOf(THEMES_TARGET, scheme).theme
  const layers = T.layers.slice(0, k).map((l) => l.id)
  const theme: Record<string, unknown> = { ...home, id: `home-${k}` }
  for (const layer of layers) for (const field of layer === 'style' ? STYLE_LAYER_FIELDS : LAYER_FIELDS[layer]) theme[field] = target[field]
  return { theme: defineTheme(theme as ThemeInput), scheme, style: layers.includes('style') ? styleById(THEMES_TARGET.style).look : styleById(THEMES_HOME.style).look }
}

/**
 * The copies: Youj in Bezel with each count of the target's layers, a copy for
 * each look's band, and each look again in the other mode, for below the mode
 * line. All in the stage's scheme but the last (so the light tile starts in
 * Youj light, and its mode line brings dark).
 */
type CopyId = `layer-${number}` | `${ThemesPalette}-${'band' | 'mode'}`

/** The four looks side by side, left to right: the target (Cinnabar) is the layers' last copy, the right-hand quarter. */
const BAND_LOOPS = [...T.bands].reverse().map((b) => ({ palette: b.palette, style: b.style }))
const ALL_LOOKS = [...BAND_LOOPS, { palette: THEMES_TARGET.palette as ThemesPalette, style: THEMES_TARGET.style as string }]
const other = (scheme: Scheme): Scheme => (scheme === 'dark' ? 'light' : 'dark')

function copiesFor(scheme: Scheme): { id: CopyId; look: Look }[] {
  return [
    ...Array.from({ length: LAYERS + 1 }, (_, k) => ({ id: `layer-${k}` as CopyId, look: layered(k, scheme) })),
    ...BAND_LOOPS.map((l) => ({ id: `${l.palette}-band` as CopyId, look: lookOf(l, scheme) })),
    ...ALL_LOOKS.map((l) => ({ id: `${l.palette}-mode` as CopyId, look: lookOf(l, other(scheme)) })),
  ]
}

/** Which palette each copy shows (the layered ones in between are none). */
const PRESET_OF = new Map<CopyId, ThemesPalette>([
  ['layer-0', 'youj'],
  [`layer-${LAYERS}`, 'cinnabar'],
  ...BAND_LOOPS.map((l) => [`${l.palette}-band`, l.palette] as const),
  ...ALL_LOOKS.map((l) => [`${l.palette}-mode`, l.palette] as const),
])

/* ── The product ───────────────────────────────────────────────────────── */

/** The app around the block: its bar, with the section tabs, a search field, the plan and the account (on a narrow screen, fewer tabs and no plan). */
function AppBar({ narrow }: { narrow: boolean }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line px-6">
      <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-on-accent">
        <CloudIcon size={16} />
      </span>
      <span className="font-semibold tracking-tight">Cumulus</span>
      <Tabs defaultValue="usage" className="ms-2">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {!narrow && <TabsTrigger value="deploys">Deploys</TabsTrigger>}
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
      </Tabs>
      <InputGroup className={`ms-auto ${narrow ? 'w-44' : 'w-56'}`}>
        <InputGroupAddon>
          <SearchIcon size={15} />
        </InputGroupAddon>
        <InputGroupInput type="search" aria-label="Search" placeholder="Search" tabIndex={-1} />
      </InputGroup>
      {!narrow && <Badge variant="outline">Scale plan</Badge>}
      <Avatar className="size-8">
        <AvatarFallback>HS</AvatarFallback>
      </Avatar>
    </header>
  )
}

/** The product at its own viewport: the app bar over the Usage & billing block. */
function Product({ width }: { width: number }) {
  return (
    <div className="flex min-h-full flex-col bg-canvas font-sans text-fg" style={{ width }}>
      <AppBar narrow={width < 1000} />
      <main className="px-6 pt-6 pb-10">
        <UsageOverview embedded />
      </main>
    </div>
  )
}

/* ── Layout per cut ────────────────────────────────────────────────────── */

interface Layout {
  /** The product's viewport, CSS px. */
  product: { w: number; h: number }
  /** How much it is scaled into the panel. */
  scale: number
  /** The panel on the stage, and where in the product it starts (product px). */
  panel: { x: number; y: number; w: number; h: number }
  offset: { x: number; y: number }
  /** The strip has no margins: labels and names sit inside the panel. */
  inside: boolean
  /** How far the camera leans in while the layers cross, and where it rests. */
  lean: number
  rest: number
}

function layoutFor(format: Format): Layout {
  if (format.tile) {
    // Full bleed, framed on the daily-cost chart: its bars fill the middle, where every tile shows them, with its range at the end.
    const scale = 0.8
    return { product: { w: 1440, h: 1000 }, scale, panel: { x: 0, y: 0, w: format.width, h: format.height }, offset: { x: 20, y: 310 }, inside: true, lean: 1.05, rest: 1.015 }
  }
  if (format.tall) {
    const panel = { x: 44, y: 96, w: 776, h: 884 }
    const scale = 0.88
    return { product: { w: panel.w / scale, h: 1300 }, scale, panel, offset: { x: 0, y: 0 }, inside: false, lean: 1.07, rest: 1.025 }
  }
  const panel = { x: 96, y: 88, w: 1248, h: 636 }
  const scale = 0.9
  return { product: { w: panel.w / scale, h: 1000 }, scale, panel, offset: { x: 0, y: 0 }, inside: false, lean: 1.085, rest: 1.03 }
}

/* ── The lines, and the regions between them ───────────────────────────── */

/** A region of the panel, as fractions of its width and height. */
interface Region {
  x0: number
  x1: number
  y0: number
  y1: number
}

const EMPTY: Region = { x0: 0, x1: 0, y0: 0, y1: 0 }
/** How far past the panel's edges a crossing line starts and ends, as a fraction of its width. */
const RUN = 0.03
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Where the k-th layer's line is, as a fraction of the panel's width: a wipe, easing out of the start edge and into the end. */
const layerAt = (f: number, k: number) => mix(-RUN, 1 + RUN, tween(f, P + T.layers[k]!.at, T.cross, 'emphasized'))
/** Where a band's line is: it slides in from the start edge and stops at its quarter. */
const bandAt = (f: number, i: number) => mix(-RUN, T.bands[i]!.stop, tween(f, P + T.bands[i]!.at, T.slide, 'emphasized'))
/** The mode line, as a fraction of the panel's height: below the foot, rising to the middle. */
const lightAt = (f: number) => mix(1 + RUN * 2, 0.5, tween(f, P + T.light, T.rise, 'emphasized'))
/** The home line: it wipes across everything once. */
const homeAt = (f: number) => mix(-RUN, 1 + RUN, tween(f, P + T.home, T.homeCross, 'emphasized'))

/** Every copy's region at a frame. Together they tile the panel. */
function regionsAt(f: number): Partial<Record<CopyId, Region>> {
  const L = T.layers.map((_, k) => clamp01(layerAt(f, k)))
  const [seaglass, heather, youjBand] = T.bands.map((_, i) => clamp01(bandAt(f, i))) as [number, number, number]
  const M = clamp01(lightAt(f))
  const H = clamp01(homeAt(f))
  // Whatever the home line has passed is Youj again; everything else is cut at it.
  const r = (x0: number, x1: number, y0 = 0, y1 = 1): Region => {
    const from = Math.max(x0, H)
    return from < x1 && y0 < y1 ? { x0: from, x1, y0, y1 } : EMPTY
  }
  const out: Partial<Record<CopyId, Region>> = {}
  // Layer by layer: the copy with k layers lies behind the line that applied the k-th and ahead of the next.
  for (let k = 1; k < LAYERS; k++) out[`layer-${k}`] = r(L[k]!, L[k - 1]!)
  // The target, whole, until the bands take it over from the start edge; above the mode line once it rises.
  out[`layer-${LAYERS}`] = r(seaglass, L[LAYERS - 1]!, 0, M)
  out['seaglass-band'] = r(heather, seaglass, 0, M)
  out['heather-band'] = r(youjBand, heather, 0, M)
  out['youj-band'] = r(0, youjBand, 0, M)
  out['cinnabar-mode'] = r(seaglass, 1, M, 1)
  out['seaglass-mode'] = r(heather, seaglass, M, 1)
  out['heather-mode'] = r(youjBand, heather, M, 1)
  out['youj-mode'] = r(0, youjBand, M, 1)
  out['layer-0'] = H > 0 ? { x0: 0, x1: H, y0: 0, y1: 1 } : r(L[0]!, 1)
  return out
}

/** Each palette's part of the panel's width at a frame (its copies in either mode, side by side): where its name goes. */
function namesAt(f: number) {
  const regions = regionsAt(f)
  const spans = new Map<ThemesPalette, { x0: number; x1: number }>()
  for (const [id, region] of Object.entries(regions) as [CopyId, Region][]) {
    const preset = PRESET_OF.get(id)
    if (!preset || region.x1 <= region.x0) continue
    const span = spans.get(preset)
    spans.set(preset, span ? { x0: Math.min(span.x0, region.x0), x1: Math.max(span.x1, region.x1) } : { x0: region.x0, x1: region.x1 })
  }
  return [...spans].map(([preset, span]) => ({ preset, ...span }))
}

/**
 * When each copy is mounted, in the simulation's frames. A copy mounts
 * `LEAD` frames before its region first opens, drawn at its values (reduced
 * motion, so it plays no entrance), starts to move `SETTLE` frames later,
 * well before it shows, so the pointer's presses animate in it as in the
 * app; it unmounts once its region has closed. Only the copies on screen,
 * or about to be, are in the page, which keeps each frame's layout small.
 *
 * Youj in Bezel, the first and last look, is the exception: one copy, mounted
 * throughout and never pressed, so the frame the loop ends on is the very
 * screen it starts on (a chart measures itself as it mounts, and a copy
 * mounted again under another camera would draw a pixel off).
 */
const LEAD = 45
const SETTLE = 24
const WINDOWS = (() => {
  const runs = new Map<CopyId, [number, number][]>()
  for (let f = 0; f <= P + TOPICS.themes.frames; f++) {
    for (const [id, r] of Object.entries(regionsAt(f)) as [CopyId, Region][]) {
      if (r.x1 <= r.x0 || r.y1 <= r.y0) continue
      const list = runs.get(id) ?? []
      const last = list.at(-1)
      if (last && last[1] === f - 1) last[1] = f
      else list.push([f, f])
      runs.set(id, list)
    }
  }
  const out = new Map<CopyId, [number, number][]>()
  for (const [id, list] of runs) {
    const merged: [number, number][] = []
    for (const [a, b] of list) {
      const from = Math.max(0, a - LEAD)
      const prev = merged.at(-1)
      if (prev && from <= prev[1] + 1) prev[1] = b + 1
      else merged.push([from, b + 1])
    }
    out.set(id, merged)
  }
  out.set('layer-0', [[0, P + TOPICS.themes.frames + 1]])
  return out
})()

/* ── The camera ────────────────────────────────────────────────────────── */

interface Shot {
  scale: number
  x: number
  y: number
}

/**
 * It leans in and drifts while the layers cross, pulls back to the whole
 * screen as the looks line up, breathes while they sit side by side, and
 * leans in again as the last line brings Youj home, landing where it
 * started. Everything moves about the panel's centre; the backdrop moves a
 * third as far, so the panel floats over it.
 */
function cameraAt(f: number, layout: Layout): Shot {
  const first = T.layers[0]!.at
  const lean = tween(f, P + first, T.layers.at(-1)!.at + T.cross - first, 'standard')
  const back = tween(f, P + T.bands[0]!.at - 36, 96, 'emphasized')
  const breathe = tween(f, P + T.bands[0]!.at + 60, T.home - T.bands[0]!.at - 60, 'standard')
  const home = tween(f, P + T.home, T.homeCross + 12, 'emphasized')
  const leaning: Shot = { scale: mix(layout.rest, layout.lean, lean), x: -layout.panel.w * 0.012 * lean, y: -layout.panel.h * 0.008 * lean }
  const wide: Shot = { scale: 1 + 0.012 * breathe, x: 0, y: 0 }
  return {
    scale: mix(mix(leaning.scale, wide.scale, back), layout.rest, home),
    x: mix(mix(leaning.x, wide.x, back), 0, home),
    y: mix(mix(leaning.y, wide.y, back), 0, home),
  }
}

/* ── The scene ─────────────────────────────────────────────────────────── */

/** The daily-cost chart's range key reading `label`, in each copy but the home one (Youj stays as the loop found it). */
const rangeKeys = (label: string) =>
  [...document.querySelectorAll<HTMLElement>('[data-themes-copy]:not([data-themes-copy="layer-0"]) [data-slot="toggle-group-item"]')].filter(
    (el) => el.textContent?.trim() === label,
  )

/** A press on each copy's key at once, as the browser sends one, straight to the element (as a captured pointer's are). */
function pressAll(label: string) {
  for (const el of rangeKeys(label)) {
    const r = el.getBoundingClientRect()
    const at = { bubbles: true, cancelable: true, composed: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0, view: window }
    const pointer = { ...at, pointerId: 1, pointerType: 'mouse', isPrimary: true }
    el.dispatchEvent(new PointerEvent('pointerdown', { ...pointer, buttons: 1, pressure: 0.5 }))
    el.dispatchEvent(new MouseEvent('mousedown', { ...at, buttons: 1 }))
    el.dispatchEvent(new PointerEvent('pointerup', { ...pointer, buttons: 0 }))
    el.dispatchEvent(new MouseEvent('mouseup', { ...at, buttons: 0 }))
    el.dispatchEvent(new MouseEvent('click', { ...at, detail: 1 }))
  }
}

/** Where the key reading `label` shows at a frame: in the copy whose region holds it. */
function visibleKey(label: string, f: number) {
  const regions = regionsAt(f)
  for (const el of rangeKeys(label)) {
    const id = el.closest<HTMLElement>('[data-themes-copy]')?.dataset.themesCopy as CopyId | undefined
    const panel = document.querySelector('[data-themes-panel]')?.getBoundingClientRect()
    const region = id ? regions[id] : undefined
    if (!panel || !region) continue
    const r = el.getBoundingClientRect()
    const x = (r.left + r.width / 2 - panel.left) / panel.width
    const y = (r.top + r.height / 2 - panel.top) / panel.height
    if (x >= region.x0 && x < region.x1 && y >= region.y0 && y < region.y1) return { x: r.left + r.width * 0.56, y: r.top + r.height * 0.62 }
  }
  return null
}

const nudge = (p: { x: number; y: number } | null, dx: number, dy: number) => (p ? { x: p.x + dx, y: p.y + dy } : null)

export function ThemesLoop() {
  const frame = useFrame()
  const format = useFormat()
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  const layout = useMemo(() => layoutFor(format), [format.width, format.height])
  const { panel, scale, product, offset } = layout
  const shot = cameraAt(frame, layout)
  const cx = panel.x + panel.w / 2
  const cy = panel.y + panel.h / 2

  // The pointer sets the chart to seven days, and later back to thirty: every copy at once.
  useAction(P + T.week, () => pressAll('7 d'))
  useAction(P + T.month, () => pressAll('30 d'))

  const scheme: Scheme = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  const copies = useMemo(
    () =>
      copiesFor(scheme).map(({ id, look }) => ({
        id,
        node: (
          <div data-themes-copy={id} data-theme={look.scheme} className="absolute top-0 left-0 overflow-hidden bg-canvas" style={{ width: product.w, height: product.h }}>
            <ThemeScope theme={look.theme} look={look.style}>
              <Product width={product.w} />
            </ThemeScope>
          </div>
        ),
      })),
    [product.w, product.h, scheme],
  )

  // `bleed`: how far the layer reaches past the stage on every side, so its own origin is that far in.
  const moved = (s: Shot, depth = 1, bleed = 0): CSSProperties => ({
    transform: `translate(${s.x * depth}px, ${s.y * depth}px) scale(${1 + (s.scale - 1) * depth})`,
    transformOrigin: `${cx + bleed}px ${cy + bleed}px`,
  })

  return (
    <div className="absolute inset-0">
      <div className="absolute -inset-16" style={moved(shot, 0.35, 64)}>
        <Backdrop grid={0.55} glow={0.2} glowAt={{ x: 50, y: 46 }} />
      </div>
      <div className="absolute inset-0" style={moved(shot)}>
        <div
          data-themes-panel=""
          className="absolute overflow-hidden"
          style={{
            left: panel.x,
            top: panel.y,
            width: panel.w,
            height: panel.h,
            borderRadius: layout.inside ? 0 : 14,
            boxShadow: layout.inside
              ? undefined
              : '0 0 0 1px color-mix(in oklab, var(--color-fg) 12%, transparent), 0 40px 90px -36px color-mix(in oklab, var(--color-shadow) 80%, transparent)',
          }}
        >
          <Camera shot={{ scale, x: -offset.x * scale, y: -offset.y * scale, originX: 0, originY: 0 }}>
            {copies.map(({ id, node }) => (
              <Clipped key={id} id={id} layout={layout}>
                {node}
              </Clipped>
            ))}
          </Camera>
        </div>
        <Lines frame={frame} layout={layout} scheme={scheme} />
        <Names frame={frame} layout={layout} scheme={scheme} />
      </div>
      <Cursor
        start={{ x: panel.x + panel.w * 0.92, y: panel.y + panel.h + 70 }}
        events={false}
        show={[P + T.week - 44, P + T.month + 44]}
        size={() => shot.scale}
        moves={[
          { at: P + T.week - 36, to: () => visibleKey('7 d', P + T.week), frames: 36, press: 'click' },
          { at: P + T.week + 16, to: () => nudge(visibleKey('7 d', P + T.week), 36, 54), frames: 44 },
          { at: P + T.month - 34, to: () => visibleKey('30 d', P + T.month), frames: 34, press: 'click' },
          { at: P + T.month + 12, to: () => nudge(visibleKey('30 d', P + T.month), 90, 170), frames: 48 },
        ]}
      />
    </div>
  )
}

/**
 * A copy under its mask: its region of the panel, in the product's own px,
 * mounted only in its windows. A mask rather than a clip: IntersectionObserver
 * counts a clip-path, so a copy's meters would fill as its region opened,
 * where a mask leaves the page as the app sees it. Re-renders only when its
 * region changes.
 */
const Clipped = memo(function Clipped({ id, layout, children }: { id: CopyId; layout: Layout; children: ReactNode }) {
  const { product, offset, panel, scale } = layout
  const windows = WINDOWS.get(id) ?? []
  const within = (f: number) => windows.find(([a, b]) => f >= a && f <= b)
  const mounted = useFrameValue((f) => Boolean(within(f)))
  const still = useFrameValue((f) => {
    const w = within(f)
    return !w || f < w[0] + SETTLE
  })
  // Its position and size as one string, so the frame store compares it by value.
  const mask = useFrameValue((f) => {
    const g = regionsAt(f)[id] ?? EMPTY
    if (g.x1 <= g.x0 || g.y1 <= g.y0) return '0px 0px|0px 0px'
    const w = panel.w / scale
    const h = panel.h / scale
    const px = (v: number) => `${v.toFixed(2)}px`
    return `${px(offset.x + g.x0 * w)} ${px(offset.y + g.y0 * h)}|${px((g.x1 - g.x0) * w)} ${px((g.y1 - g.y0) * h)}`
  })
  if (!mounted) return null
  const [position, size] = mask.split('|') as [string, string]
  return (
    <div
      className="absolute top-0 left-0 isolate"
      style={{
        width: product.w,
        height: product.h,
        maskImage: SOLID,
        WebkitMaskImage: SOLID,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: position,
        WebkitMaskPosition: position,
        maskSize: size,
        WebkitMaskSize: size,
      }}
    >
      <YoujProvider reducedMotion={still ? 'always' : 'never'}>{children}</YoujProvider>
    </div>
  )
})

const SOLID = 'linear-gradient(#000, #000)'

/* ── The lines and the names ───────────────────────────────────────────── */

const lookFor = (palette: ThemesPalette) => ALL_LOOKS.find((l) => l.palette === palette)!
const themeFor = (palette: ThemesPalette) => lookOf(lookFor(palette), 'dark').theme
const accentOf = (palette: ThemesPalette, scheme: Scheme) => formatOklch(derivePalette(themeFor(palette), scheme).accent)
const NAMES = Object.fromEntries(ALL_LOOKS.map((l) => [l.palette, `${paletteById(l.palette).name} · ${styleById(l.style).name}`])) as Record<ThemesPalette, string>
const MODE_NAMES: Record<Scheme, string> = { dark: 'Dark', light: 'Light' }

/** A line fades in off the start edge and out past the end. */
const edgeFade = (p: number) => Math.max(0, Math.min(1, (p + RUN) / RUN, (1 + RUN - p) / RUN))

const MONO_LABEL = 'font-mono text-[11px] leading-none font-medium tracking-[0.12em] whitespace-nowrap uppercase'
/** A name on the screen itself: a small chip in the stage's own surface, legible over any look in either mode. */
const CHIP = 'rounded-full border border-line bg-surface px-2.5 py-1 text-fg'

/**
 * How far a line's name sits from the line: centred on it, except near the
 * panel's edges, where it waits inside them for the line to catch up, so it
 * never runs off the frame while the camera is in close.
 */
function chipShift(label: string, at: number, panel: Layout['panel']) {
  const half = (label.length * 7.9 + 34) / 2
  const centre = Math.min(Math.max(at, panel.x + half), panel.x + panel.w - half)
  return centre - at
}

function Lines({ frame, layout, scheme }: { frame: number; layout: Layout; scheme: Scheme }) {
  const { panel, inside } = layout
  const x = (t: number) => panel.x + t * panel.w
  const violet = accentOf('cinnabar', scheme)
  const home = homeAt(frame)
  const verticals: { at: number; accent: string; label?: string; show: number }[] = []
  T.layers.forEach((layer, k) => {
    const p = layerAt(frame, k)
    if (p > -RUN && p < 1 + RUN) verticals.push({ at: p, accent: violet, label: LAYER_NAMES[layer.id], show: edgeFade(p) })
  })
  T.bands.forEach((band, i) => {
    const p = bandAt(frame, i)
    if (p > -RUN && p > home) verticals.push({ at: p, accent: accentOf(band.palette, scheme), show: Math.min(1, (p + RUN) / (RUN * 2)) })
  })
  if (home > -RUN && home < 1 + RUN) verticals.push({ at: home, accent: accentOf('youj', scheme), show: edgeFade(home) })
  const mode = lightAt(frame)
  const rise = tween(frame, P + T.light, T.rise, 'emphasized')
  const from = clamp01(home)
  const reach = inside ? 0 : 8
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {verticals.map((v, i) => (
        <div key={i} className="absolute" style={{ left: x(clamp01(v.at)), top: panel.y - reach, height: panel.h + reach * 2, width: 0, opacity: v.show }}>
          <div className="absolute inset-y-0 -left-[0.75px] w-[1.5px]" style={{ background: v.accent, boxShadow: `0 0 16px 1px color-mix(in oklab, ${v.accent} 50%, transparent)` }} />
          {v.label && (
            <span
              className={`absolute flex -translate-x-1/2 items-center gap-1.5 ${CHIP} ${MONO_LABEL}`}
              style={{ top: inside ? 18 : -22, left: chipShift(v.label, x(clamp01(v.at)), panel) }}
            >
              <span className="size-1.5 rounded-[1px]" style={{ background: v.accent }} />
              {v.label}
            </span>
          )}
        </div>
      ))}
      {mode < 1 + RUN && from < 1 && (
        <div className="absolute" style={{ top: panel.y + Math.min(1, mode) * panel.h, left: x(from) - (from > 0 ? 0 : reach), width: x(1) - x(from) + reach * (from > 0 ? 1 : 2), height: 0 }}>
          <div className="absolute inset-x-0 -top-[0.75px] h-[1.5px] bg-fg" style={{ boxShadow: '0 0 16px 1px color-mix(in oklab, var(--color-fg) 40%, transparent)' }} />
          <span className={`absolute end-3 ${CHIP} ${MONO_LABEL}`} style={{ top: -30, opacity: rise }}>
            {MODE_NAMES[scheme]}
          </span>
          <span className={`absolute end-3 ${CHIP} ${MONO_LABEL}`} style={{ top: 9, opacity: rise }}>
            {MODE_NAMES[other(scheme)]}
          </span>
        </div>
      )}
    </div>
  )
}

/** Under the panel (on the strip, along its foot), each look's name in its own face, centred on its part of the screen. */
function Names({ frame, layout, scheme }: { frame: number; layout: Layout; scheme: Scheme }) {
  const { panel, inside } = layout
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {namesAt(frame).map(({ preset, x0, x1 }) => {
        const show = clamp01((x1 - x0 - 0.07) / 0.08)
        if (show <= 0) return null
        const accent = accentOf(preset, scheme)
        return (
          <span
            key={preset}
            className={`absolute flex -translate-x-1/2 items-center gap-2 text-[15px] leading-none font-medium tracking-[-0.01em] whitespace-nowrap text-fg ${inside ? 'rounded-full border border-line bg-surface px-3 py-1.5' : ''}`}
            style={{ left: panel.x + ((x0 + x1) / 2) * panel.w, top: inside ? panel.y + panel.h - 44 : panel.y + panel.h + 22, opacity: show, fontFamily: themeFor(preset).fonts?.sans }}
          >
            <span className="size-2 rounded-full" style={{ background: accent, boxShadow: `0 0 10px color-mix(in oklab, ${accent} 60%, transparent)` }} />
            {NAMES[preset]}
          </span>
        )
      })}
    </div>
  )
}
