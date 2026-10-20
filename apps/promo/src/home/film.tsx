import { memo, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { easings } from '@youj/core'
import {
  BellIcon,
  CheckCheckIcon,
  CheckIcon,
  CircleIcon,
  CopyIcon,
  HeartIcon,
  IconSwap,
  LayersIcon,
  LinkIcon,
  MenuIcon,
  MoonIcon,
  PaletteIcon,
  PlayIcon,
  PlusIcon,
  RocketIcon,
  SearchIcon,
  SendIcon,
  ShareIcon,
  SparklesIcon,
  StarIcon,
  SunIcon,
  SunriseIcon,
  UserPlusIcon,
  WandIcon,
  ZapIcon,
  type YoujIconComponent,
} from '@youj/icons'
import { AvatarStack } from '@youj/react/components/ui/avatar-stack'
import { Badge } from '@youj/react/components/ui/badge'
import { Button } from '@youj/react/components/ui/button'
import { Input } from '@youj/react/components/ui/input'
import { Switch } from '@youj/react/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@youj/react/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@youj/react/components/ui/toggle-group'
import { mix, spring, tween } from '../lib/timing'
import { useFrame, useFrameValue } from '../sim/simulation'
import { Backdrop } from '../film/backdrop'
import { Camera } from '../film/camera'
import { Cursor, type Point } from '../film/cursor'
import { Keylines } from '../film/keylines'
import { mixTuning, paletteVars, tuningOf, type Scheme } from '../film/palette'
import { HOME, HOME_BEATS as B } from './beats'

/* The homepage film (beats.ts has the story). Laid out on the homepage
 * loop's stage (1200 × 675 at 1.6), so at the section's width the UI is the
 * size the site itself shows it.
 *
 * The sheet is the site's construction frame: hairline rails and rules with
 * registration marks, a mono eyebrow per cell, the square particle and the
 * display face. Everything on it is the library's own: the card's parts are
 * the real Badge, Switch, Button and IconSwap; the cells hold the real Tabs,
 * Input, AvatarStack and ToggleGroup, the icon set, and the motion tokens'
 * own curves. The theme is the contract's palette and radius, mixed in OKLab
 * from Basalt to Terminal and back (film/palette.ts), on one wrapper, so the
 * whole frame re-themes at once; transitions are off inside it
 * ([data-live-theme]), as an app turns them off while a theme changes.
 *
 * The icon tile is drawn by layout rather than under the camera's
 * transform: at its macro close-up every pixel of it lands where the lens
 * says, keylines and all. */

const P = HOME.preroll

/* ── The sheet, in stage px ────────────────────────────────────────────── */

const RAIL = { start: 40, end: 1160 }
const RULE = { top: 50, bottom: 625 }
const COL = { a: 356, b: 844 }
const ROW = 338
/** The card, centred in the middle column above its line. */
const CARD = { w: 404, h: 222 }
const CARD_AT = { x: 600 - CARD.w / 2, y: 300 - CARD.h / 2 }
/** The icon tile on the card: its box in card px. */
const TILE = { x: 20, y: 20, size: 36, icon: 18 }
const TILE_CENTRE = { x: CARD_AT.x + TILE.x + TILE.size / 2, y: CARD_AT.y + TILE.y + TILE.size / 2 }

/* ── The lens: a stage point shown at the frame's centre, at a scale ──── */

interface Lens {
  scale: number
  x: number
  y: number
}

const REST: Lens = { scale: 1, x: 600, y: 337.5 }
const ON_CARD: Lens = { scale: 2, x: 600, y: CARD_AT.y + CARD.h / 2 }
const ON_ICON: Lens = { scale: 11, x: TILE_CENTRE.x, y: TILE_CENTRE.y }

/** Zooms move in log scale, so a push reads at an even rate. */
function between(a: Lens, b: Lens, t: number): Lens {
  return { scale: Math.exp(mix(Math.log(a.scale), Math.log(b.scale), t)), x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) }
}

function lensAt(f: number): Lens {
  let lens = between(REST, ON_CARD, tween(f, P + B.dive, B.diveLength, 'emphasized'))
  lens = between(lens, ON_ICON, tween(f, P + B.iconPush, B.iconPushLength, 'emphasized'))
  lens = between(lens, ON_CARD, tween(f, P + B.iconPull, B.iconPullLength, 'emphasized'))
  return between(lens, REST, tween(f, P + B.pull, B.pullLength, 'emphasized'))
}

/* ── The build: each primitive's presence, 0 → 1 ───────────────────────── */

type PartId = keyof typeof B.parts
const PARTS = Object.keys(B.parts) as PartId[]

/** 1 at rest; the card comes apart (last part first) and drafts itself again. */
function built(f: number, id: PartId, length = 30) {
  if (f < P + B.build) {
    const i = PARTS.indexOf(id)
    return 1 - tween(f, P + B.undo + (PARTS.length - 1 - i) * B.undoStagger, 16, 'exit')
  }
  return tween(f, P + B.build + B.parts[id], length, 'enter')
}

/** A part that lands on the settle spring: its scale and presence. */
function landed(f: number, id: PartId, delay = 0) {
  if (f < P + B.build) return { scale: 1, show: built(f, id) }
  const s = spring(f, P + B.build + B.parts[id] + delay, 'settle')
  return { scale: mix(0.6, 1, s), show: Math.min(1, s * 1.6) }
}

/* ── The theme: Basalt, Terminal for a while, Basalt again ────────────────── */

function Themed({ scheme, children }: { scheme: Scheme; children: ReactNode }) {
  const frame = useFrame()
  const base = useMemo(() => tuningOf('basalt', scheme), [scheme])
  const passing = useMemo(() => tuningOf('terminal', scheme), [scheme])
  const t = tween(frame, P + B.themeIn, B.themeInLength, 'emphasized') - tween(frame, P + B.themeOut, B.themeOutLength, 'emphasized')
  const tuning = mixTuning(base, passing, t)
  const style = { ...paletteVars(tuning.palette), '--yj-radius': `${tuning.radius}px` } as CSSProperties
  return (
    <div data-yj-theme="film" data-live-theme="" className="absolute inset-0" style={style}>
      {children}
    </div>
  )
}

/* ── The film ──────────────────────────────────────────────────────────── */

export function HomeFilm({ scheme }: { scheme: Scheme }) {
  return (
    <Themed scheme={scheme}>
      <Sheet scheme={scheme} />
    </Themed>
  )
}

function Sheet({ scheme }: { scheme: Scheme }) {
  const frame = useFrame()
  const root = useRef<HTMLDivElement>(null)
  const lens = lensAt(frame)
  const shot = { scale: lens.scale, x: 600 - lens.x * lens.scale, y: 337.5 - lens.y * lens.scale, originX: 0, originY: 0 }
  const project = (p: Point): Point => ({ x: 600 + (p.x - lens.x) * lens.scale, y: 337.5 + (p.y - lens.y) * lens.scale })

  // The sheet around the card: there at rest, gone for the close-up, back for the pull.
  const around = 1 - tween(frame, P + B.dive, B.diveLength * 0.45, 'exit') + tween(frame, P + B.pull + B.pullLength * 0.25, B.pullLength * 0.6, 'enter')
  const caption = 1 - tween(frame, P + B.captionOut, 24, 'exit') + tween(frame, P + B.captionIn, 40, 'enter')

  const cells = useMemo(
    () => (
      <>
        <ComponentsCell />
        <MotionCell />
        <IconsCell />
        <ThemesCell />
      </>
    ),
    [],
  )
  const frameLines = useMemo(() => <FrameLines />, [])

  const find = (selector: string, dx = 0.5, dy = 0.5) => (): Point | null => {
    const el = root.current?.querySelector(selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width * dx, y: r.top + r.height * dy }
  }

  return (
    <div ref={root} className="absolute inset-0">
      <Backdrop grid={0.55} glow={scheme === 'dark' ? 0.32 : 0.22} glowAt={{ x: 50, y: 44 }} />
      <Camera shot={shot}>
        <div className="absolute inset-0" style={{ opacity: around }}>
          {frameLines}
          {cells}
        </div>
        <Caption show={caption} />
        <Card />
      </Camera>
      <IconTile project={project} scale={lens.scale} />
      <Names project={project} scale={lens.scale} />
      <Cursor
        start={{ x: 900, y: 720 }}
        size={() => lens.scale * 0.55}
        show={[P + B.reach - 6, P + B.press + 70]}
        moves={[
          { at: P + B.reach, to: find('[data-home=ship]', 0.62, 0.6), frames: B.press - B.reach - 6, press: 'click', after: 6 },
          { at: P + B.press + 26, to: { x: 1010, y: 760 }, frames: 40 },
        ]}
      />
    </div>
  )
}

/* ── The construction frame ────────────────────────────────────────────── */

/** A registration mark: the site's cross where a rule meets a rail. */
function Mark({ x, y }: { x: number; y: number }) {
  return (
    <span aria-hidden className="absolute" style={{ left: x - 5.5, top: y - 5.5, width: 11, height: 11 }}>
      <span className="absolute top-0 left-[5px] h-full w-px bg-line-strong" />
      <span className="absolute top-[5px] left-0 h-px w-full bg-line-strong" />
    </span>
  )
}

const FrameLines = memo(function FrameLines() {
  const h = (y: number, from = 0, to = 1200) => <span className="absolute h-px bg-line" style={{ top: y, left: from, width: to - from }} />
  const v = (x: number, from = 0, to = 675) => <span className="absolute w-px bg-line" style={{ left: x, top: from, height: to - from }} />
  return (
    <div aria-hidden className="absolute inset-0">
      {v(RAIL.start)}
      {v(RAIL.end)}
      {h(RULE.top)}
      {h(RULE.bottom)}
      {v(COL.a, RULE.top, RULE.bottom)}
      {v(COL.b, RULE.top, RULE.bottom)}
      {h(ROW, RAIL.start, COL.a)}
      {h(ROW, COL.b, RAIL.end)}
      {[RAIL.start, COL.a, COL.b, RAIL.end].flatMap((x) => [RULE.top, RULE.bottom].map((y) => <Mark key={`${x}-${y}`} x={x} y={y} />))}
      <Mark x={RAIL.start} y={ROW} />
      <Mark x={RAIL.end} y={ROW} />
    </div>
  )
})

/** A cell's label, as the site's eyebrows: the particle, then the name in mono. */
function Eyebrow({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <p className="absolute flex items-center gap-2 font-mono text-[10.5px] leading-none tracking-[0.14em] text-fg-muted uppercase" style={{ left: x, top: y }}>
      <span aria-hidden className="size-[5px] rounded-[1px] bg-accent" />
      {children}
    </p>
  )
}

function Caption({ show }: { show: number }) {
  if (show <= 0) return null
  return (
    <p
      className="absolute inset-x-0 text-center text-[40px] leading-none font-[580] tracking-[-0.038em] text-fg"
      style={{ top: 488, opacity: show, transform: `translateY(${(1 - show) * 8}px)` }}
    >
      Designed as one.
    </p>
  )
}

/* ── The card ──────────────────────────────────────────────────────────── */

function Card() {
  const frame = useFrame()
  const outline = built(frame, 'outline')
  const radius = built(frame, 'radius')
  const surface = built(frame, 'surface', 36)
  const type = built(frame, 'type', 36)
  const tile = built(frame, 'icon', 24)
  const badge = landed(frame, 'controls')
  const toggle = landed(frame, 'controls', 6)
  const later = landed(frame, 'controls', 12)
  const ship = landed(frame, 'accent')
  // The construction lines: laid bare as the card comes apart, redrawn as it drafts, gone with the names once it's whole.
  const lines = frame < P + B.build ? tween(frame, P + B.undo + 6, 24, 'enter') * (1 - tween(frame, P + B.build - 14, 14, 'exit')) : 1 - tween(frame, P + B.namesOut, 30, 'exit')
  const draw = frame < P + B.build ? 1 : outline
  const rx = frame < P + B.build ? 12 : mix(0, 12, radius)

  return (
    <div className="absolute" style={{ left: CARD_AT.x, top: CARD_AT.y, width: CARD.w, height: CARD.h }}>
      {lines > 0 && (
        <svg aria-hidden className="absolute overflow-visible" style={{ left: 0, top: 0 }} width={CARD.w} height={CARD.h} fill="none">
          <rect
            x={0.5}
            y={0.5}
            width={CARD.w - 1}
            height={CARD.h - 1}
            rx={rx}
            stroke="var(--color-line-strong)"
            pathLength={1000}
            strokeDasharray={`${draw * 1000} 1000`}
            style={{ opacity: lines }}
          />
          {[
            [0, 0],
            [CARD.w, 0],
            [0, CARD.h],
            [CARD.w, CARD.h],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`} stroke="var(--color-line-strong)" style={{ opacity: lines }}>
              <line x1={x! - 9} y1={y} x2={x! + 9} y2={y} />
              <line x1={x} y1={y! - 9} x2={x} y2={y! + 9} />
            </g>
          ))}
        </svg>
      )}
      <div
        className="absolute inset-0 rounded-xl border border-line bg-surface shadow-lg"
        style={{ opacity: surface, transform: `scale(${mix(0.985, 1, surface)})` }}
      />
      <div className="absolute" style={{ left: 68, top: 21, opacity: type, transform: `translateY(${(1 - type) * 4}px)` }}>
        <p className="text-[15px] leading-5 font-semibold tracking-[-0.01em] text-fg">Release</p>
        <p className="text-ui-sm text-fg-muted">Everything’s checked. Ship when you’re ready.</p>
      </div>
      <div className="absolute" style={{ right: 20, top: 22, opacity: badge.show, transform: `scale(${badge.scale})`, transformOrigin: 'right center' }}>
        <ReleaseBadge />
      </div>
      <span aria-hidden className="absolute h-px bg-line" style={{ left: 20, right: 20, top: 78, opacity: surface }} />
      <div className="absolute" style={{ left: 20, top: 92, opacity: type, transform: `translateY(${(1 - type) * 4}px)` }}>
        <p className="text-ui font-medium text-fg">Tell the team</p>
        <p className="text-ui-sm text-fg-muted">Posts to the launch channel once it’s out.</p>
      </div>
      <div className="absolute" style={{ right: 20, top: 100, opacity: toggle.show, transform: `scale(${toggle.scale})` }}>
        <TeamSwitch />
      </div>
      <span aria-hidden className="absolute h-px bg-line" style={{ left: 20, right: 20, top: 144, opacity: surface }} />
      <div className="absolute flex items-center gap-2" style={{ right: 20, top: 164 }}>
        <div style={{ opacity: later.show, transform: `scale(${later.scale})` }}>
          <Button variant="ghost" tabIndex={-1}>
            Later
          </Button>
        </div>
        <div data-home="ship" style={{ opacity: ship.show, transform: `scale(${ship.scale})` }}>
          <ShipButton />
        </div>
      </div>
      {/* The tile's place on the card: its surface is drawn by layout (IconTile), over this. */}
      <span aria-hidden className="absolute" style={{ left: TILE.x, top: TILE.y, width: TILE.size, height: TILE.size, opacity: tile }} />
    </div>
  )
}

/** Ready, then Live once it ships, until the card sets itself back. */
function ReleaseBadge() {
  const live = useFrameValue((f) => f >= P + B.resolve + B.resolveLength / 2 && f < P + B.reset + B.resolveLength / 2)
  return live ? <Badge>Live</Badge> : <Badge variant="secondary">Ready</Badge>
}

function TeamSwitch() {
  const on = useFrameValue((f) => f >= P + B.switchOn && f < P + B.reset + 20)
  return <Switch checked={on} tabIndex={-1} aria-label="Tell the team" />
}

/** The primary action: its icon morphs send → check as the release goes out, and back as the card resets. */
function ShipButton() {
  const frame = useFrame()
  const p = tween(frame, P + B.resolve, B.resolveLength, 'emphasized') - tween(frame, P + B.reset, B.resolveLength, 'emphasized')
  const shipped = p > 0.5
  return (
    <Button tabIndex={-1} className="w-[112px] justify-center">
      <IconSwap from={SendIcon} to={CheckIcon} progress={p} transition="morph" size={15} strokeWidth={2} />
      {shipped ? 'Shipped' : 'Ship it'}
    </Button>
  )
}

/* ── The icon tile, drawn by layout at any magnification ───────────────── */

function IconTile({ project, scale }: { project: (p: Point) => Point; scale: number }) {
  const frame = useFrame()
  const tile = built(frame, 'icon', 24)
  if (tile <= 0) return null
  const c = project(TILE_CENTRE)
  const size = TILE.size * scale
  const icon = TILE.icon * scale
  // The keylines belong to the close-up.
  const keys = tween(frame, P + B.iconPush + 18, 30, 'enter') * (1 - tween(frame, P + B.iconPull, 30, 'exit'))
  // Out of the keyline circle, into the rocket; at rest it is the rocket.
  const morph = frame < P + B.build ? 1 : tween(frame, P + B.morph, B.morphLength, 'emphasized')
  return (
    <div
      aria-hidden
      className="absolute"
      style={{ left: c.x - size / 2, top: c.y - size / 2, width: size, height: size, opacity: tile, borderRadius: 9 * scale, background: 'color-mix(in oklab, var(--color-accent) 12%, var(--color-surface))' }}
    >
      {keys > 0 && (
        <div className="absolute" style={{ left: (size - icon * (24 / 24)) / 2, top: (size - icon) / 2, width: icon, height: icon, opacity: keys }}>
          <Keylines size={icon} hairline={24 / icon} grid={0.5} />
        </div>
      )}
      <div className="absolute grid place-items-center text-accent" style={{ inset: 0 }}>
        <IconSwap from={CircleIcon} to={RocketIcon} progress={morph} transition="morph" size={icon} strokeWidth={1.75} />
      </div>
    </div>
  )
}

/* ── The primitives' names, as the card drafts itself ─────────────────── */

const NAMES: { id: PartId; name: string; at: Point; side: 'start' | 'end' }[] = [
  { id: 'outline', name: 'Layout', at: { x: CARD.w, y: 0 }, side: 'end' },
  { id: 'radius', name: 'Radius', at: { x: 0, y: 0 }, side: 'start' },
  { id: 'surface', name: 'Surface', at: { x: CARD.w, y: 60 }, side: 'end' },
  { id: 'type', name: 'Type', at: { x: 13, y: 101 }, side: 'start' },
  { id: 'icon', name: 'Icon', at: { x: TILE.x, y: TILE.y + TILE.size / 2 }, side: 'start' },
  { id: 'controls', name: 'Spring', at: { x: CARD.w - 20, y: 111 }, side: 'end' },
  { id: 'accent', name: 'Accent', at: { x: CARD.w - 20, y: 181 }, side: 'end' },
]

function Names({ project, scale }: { project: (p: Point) => Point; scale: number }) {
  const frame = useFrame()
  const out = 1 - tween(frame, P + B.namesOut, 30, 'exit')
  // Only at the card's own close-up: not on the way in, nor at the icon's macro.
  const close = Math.max(0, 1 - Math.abs(Math.log(scale / ON_CARD.scale)) * 3)
  if (frame < P + B.build || out <= 0 || close <= 0) return null
  return (
    <>
      {NAMES.map(({ id, name, at, side }) => {
        const show = tween(frame, P + B.build + B.parts[id] + (id === 'icon' ? 140 : 0), 20, 'enter') * out * close
        if (show <= 0) return null
        const anchor = project({ x: CARD_AT.x + at.x, y: CARD_AT.y + at.y })
        // The name sits in the margin; its leader runs from the name to the part.
        const edge = side === 'start' ? 24 : 1176
        const leader = side === 'start' ? { from: edge + 78, to: anchor.x } : { from: anchor.x, to: edge - 78 }
        return (
          <div key={id} className="absolute inset-x-0" style={{ top: anchor.y, opacity: show }}>
            <span aria-hidden className="absolute h-px bg-line-strong" style={{ left: leader.from, width: Math.max(0, leader.to - leader.from) }} />
            <span aria-hidden className="absolute size-[5px] -translate-1/2 rounded-full bg-fg" style={{ left: anchor.x }} />
            <span
              className="absolute flex -translate-y-1/2 items-center gap-1.5 font-mono text-[11px] leading-none tracking-[0.12em] text-fg uppercase"
              style={side === 'start' ? { left: edge } : { right: 1200 - edge }}
            >
              <span aria-hidden className="size-[5px] rounded-[1px] bg-accent" />
              {name}
            </span>
          </div>
        )
      })}
    </>
  )
}

/* ── The cells around it ───────────────────────────────────────────────── */

const TABS = ['Overview', 'Activity', 'Members']
const TEAM = [
  { id: 'mira', name: 'Mira Chen' },
  { id: 'jonas', name: 'Jonas Weber' },
  { id: 'ines', name: 'Inês Duarte' },
]

function ComponentsCell() {
  const tab = useFrameValue((f) => (f >= P + B.glides[0]! && f < P + B.glides[1]! ? 'activity' : 'overview'))
  return (
    <>
      <Eyebrow x={RAIL.start + 20} y={RULE.top + 20}>
        Components
      </Eyebrow>
      <div className="absolute" style={{ left: RAIL.start + 20, top: RULE.top + 50 }}>
        <Tabs value={tab}>
          <TabsList>
            {TABS.map((label) => (
              <TabsTrigger key={label} value={label.toLowerCase()} tabIndex={-1}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="absolute" style={{ left: RAIL.start + 20, top: RULE.top + 110, width: COL.a - RAIL.start - 40 }}>
        <div className="relative">
          <SearchIcon size={15} strokeWidth={1.75} className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-fg-muted" />
          <Input tabIndex={-1} placeholder="Search components" className="ps-8" readOnly />
        </div>
      </div>
      <div className="absolute flex items-center gap-3" style={{ left: RAIL.start + 20, top: RULE.top + 172 }}>
        <AvatarStack users={TEAM} max={TEAM.length} size="sm" label="Team" />
        <Button variant="outline" size="sm" tabIndex={-1}>
          <UserPlusIcon size={14} strokeWidth={1.75} />
          Invite
        </Button>
      </div>
    </>
  )
}

/** The emphasized ease and the settle spring, as the tokens define them, with a playhead that runs once. */
const PLOT = { x: RAIL.start + 20, y: ROW + 58, w: COL.a - RAIL.start - 40, h: 150 }
const [X1, Y1, X2, Y2] = easings.emphasized
const SPRING_SECONDS = 0.8
const springAt = (t: number) => spring(t * SPRING_SECONDS * 60, 0, 'settle')
const plotX = (t: number) => t * PLOT.w
const plotY = (v: number) => PLOT.h - 16 - v * (PLOT.h - 40)
const EASE_PATH = `M ${plotX(0)} ${plotY(0)} C ${plotX(X1)} ${plotY(Y1)} ${plotX(X2)} ${plotY(Y2)} ${plotX(1)} ${plotY(1)}`
const SPRING_PATH = `M ${Array.from({ length: 121 }, (_, i) => `${plotX(i / 120).toFixed(2)} ${plotY(springAt(i / 120)).toFixed(2)}`).join(' L ')}`

/** Where the ease is at time t: solved on its bezier by bisection. */
function easeAt(t: number) {
  const bx = (u: number) => 3 * (1 - u) ** 2 * u * X1 + 3 * (1 - u) * u ** 2 * X2 + u ** 3
  const by = (u: number) => 3 * (1 - u) ** 2 * u * Y1 + 3 * (1 - u) * u ** 2 * Y2 + u ** 3
  let lo = 0
  let hi = 1
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2
    if (bx(m) < t) lo = m
    else hi = m
  }
  return by((lo + hi) / 2)
}

function MotionCell() {
  const frame = useFrame()
  const run = (frame - P - B.playhead) / B.playheadLength
  const t = Math.min(1, Math.max(0, run))
  const playing = run > 0 && run < 1.25
  const fade = run < 1 ? 1 : Math.max(0, 1 - (run - 1) * 4)
  return (
    <>
      <Eyebrow x={RAIL.start + 20} y={ROW + 20}>
        Motion
      </Eyebrow>
      <svg aria-hidden className="absolute overflow-visible" style={{ left: PLOT.x, top: PLOT.y }} width={PLOT.w} height={PLOT.h} fill="none">
        <g stroke="var(--color-line)">
          {[0.25, 0.5, 0.75].map((u) => (
            <line key={u} x1={plotX(u)} y1={0} x2={plotX(u)} y2={PLOT.h - 16} strokeDasharray="2 3" />
          ))}
          <line x1={0} y1={plotY(0)} x2={PLOT.w} y2={plotY(0)} />
          <line x1={0} y1={plotY(1)} x2={PLOT.w} y2={plotY(1)} strokeDasharray="2 3" />
        </g>
        <path d={EASE_PATH} stroke="var(--color-fg)" strokeWidth={1.5} strokeLinecap="round" />
        <path d={SPRING_PATH} stroke="var(--color-accent)" strokeWidth={1.5} strokeLinecap="round" />
        {playing && (
          <g style={{ opacity: fade }}>
            <line x1={plotX(t)} y1={0} x2={plotX(t)} y2={PLOT.h - 16} stroke="var(--color-line-strong)" />
            <circle cx={plotX(t)} cy={plotY(easeAt(t))} r={3.5} fill="var(--color-fg)" />
            <circle cx={plotX(t)} cy={plotY(springAt(t))} r={3.5} fill="var(--color-accent)" />
          </g>
        )}
      </svg>
      <p className="absolute flex gap-5 font-mono text-[10.5px] leading-none tracking-[0.04em] text-fg-muted" style={{ left: PLOT.x, top: PLOT.y + PLOT.h + 6 }}>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-px w-3 bg-fg" />
          ease · emphasized
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-px w-3 bg-accent" />
          spring · settle
        </span>
      </p>
    </>
  )
}

/** The set, a few of it, a wave passing through from the card's side. */
const SET: YoujIconComponent[] = [
  BellIcon, HeartIcon, StarIcon, PlayIcon, MenuIcon, CheckIcon,
  SparklesIcon, CopyIcon, SunIcon, ZapIcon, LayersIcon, SendIcon,
  MoonIcon, LinkIcon, PaletteIcon, WandIcon, ShareIcon, PlusIcon,
  SearchIcon, RocketIcon, UserPlusIcon, CircleIcon, SunriseIcon, CheckCheckIcon,
]
const GRID = { cols: 6, pitch: 48, icon: 22 }

function IconsCell() {
  const originX = COL.b + (RAIL.end - COL.b - (GRID.cols - 1) * GRID.pitch) / 2
  return (
    <>
      <Eyebrow x={COL.b + 20} y={RULE.top + 20}>
        Icons
      </Eyebrow>
      {SET.map((Icon, i) => {
        const col = i % GRID.cols
        const row = Math.floor(i / GRID.cols)
        return <WaveIcon key={i} Icon={Icon} x={originX + col * GRID.pitch} y={RULE.top + 86 + row * GRID.pitch} delay={col * 7 + row * 3} />
      })}
    </>
  )
}

function WaveIcon({ Icon, x, y, delay }: { Icon: YoujIconComponent; x: number; y: number; delay: number }) {
  const at = P + B.wave + delay
  const active = useFrameValue((f) => f >= at && f < at + 48)
  const front = useFrameValue((f) => Math.round(Math.max(0, 1 - Math.abs(f - at - 8) / 14) * 20) / 20)
  return (
    <span
      className="absolute grid place-items-center"
      style={{ left: x - GRID.icon / 2, top: y - GRID.icon / 2, width: GRID.icon, height: GRID.icon, color: `color-mix(in oklab, var(--color-accent) ${front * 100}%, var(--color-fg-muted))` }}
    >
      <Icon size={GRID.icon} strokeWidth={1.5} active={active} trigger="none" />
    </span>
  )
}

const PRESETS = [
  { id: 'basalt', name: 'Basalt' },
  { id: 'graphite', name: 'Graphite' },
  { id: 'terminal', name: 'Terminal' },
  { id: 'brutal', name: 'Brutal' },
] as const

function ThemesCell() {
  const preset = useFrameValue((f) => (f >= P + B.themeIn && f < P + B.themeOut ? 'terminal' : 'basalt'))
  const x = COL.b + 20
  return (
    <>
      <Eyebrow x={x} y={ROW + 20}>
        Themes
      </Eyebrow>
      <div className="absolute" style={{ left: x, top: ROW + 56 }}>
        <ToggleGroup variant="segmented" value={[preset]} aria-label="Theme">
          {PRESETS.map((p) => (
            <ToggleGroupItem key={p.id} value={p.id} tabIndex={-1} className="px-3">
              {p.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="absolute flex items-end gap-4" style={{ left: x, top: ROW + 120 }}>
        <span className="text-[52px] leading-[0.9] font-[580] tracking-[-0.04em] text-fg">Aa</span>
        <div className="flex gap-2 pb-1">
          {['var(--color-canvas)', 'var(--color-surface)', 'var(--color-fg)', 'var(--color-accent)'].map((color) => (
            <span key={color} className="size-8 rounded-(--yj-radius) border border-line-strong" style={{ background: color }} />
          ))}
        </div>
      </div>
      <p className="absolute font-mono text-[10.5px] leading-none tracking-[0.04em] text-fg-muted" style={{ left: x, top: ROW + 200 }}>
        canvas · surface · ink · accent
      </p>
    </>
  )
}
