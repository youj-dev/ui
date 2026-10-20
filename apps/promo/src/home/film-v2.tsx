import { memo, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { motionPersonalities, type MotionPersonality } from '@youj/core'
import { LoaderOffshoot } from '@youj/loaders/offshoot'
import { BellIcon, CircleIcon, EyeIcon, GitBranchIcon, GitMergeIcon, GitPullRequestIcon, IconSwap, SendIcon, UserPlusIcon } from '@youj/icons'
import { illustrations } from '@youj/illustrations'
import { ActionIsland, ActionIslandGroup, ActionIslandMark, ActionIslandSeparator, ActionIslandTile } from '@youj/react/components/ui/action-island'
import { AvatarStack } from '@youj/react/components/ui/avatar-stack'
import { Badge } from '@youj/react/components/ui/badge'
import { Button } from '@youj/react/components/ui/button'
import { AsyncButton } from '@youj/react/components/ui/async-button'
import { SegmentedControl, SegmentedControlItem } from '@youj/react/components/ui/segmented-control'
import { HistoryStrip, type UptimeDay } from '@youj/react/components/ui/history-strip'
import { spring as motionSpring } from 'motion'
import { mix, spring, tween } from '../lib/timing'
import { useFrame, useFrameValue } from '../sim/simulation'
import { Backdrop } from '../film/backdrop'
import { Camera } from '../film/camera'
import { Cursor, type Point } from '../film/cursor'
import { Keylines } from '../film/keylines'
import { mixTuning, paletteVars, tuningOf, type Scheme } from '../film/palette'
import { CUE_BINS, GLASS } from '../loops/sound-cues'
import { HOME_V2, HOME_V2_BEATS as B } from './beats-v2'

/* The homepage film, v2 (beats-v2.ts has the story, HOME-FILM-V2.md the
 * storyboard). v1's sheet, camera and theme pass, with the kit as it is now:
 * the card holds an isometric scene from the registry and deploys from an
 * ActionIsland, waiting on a real loader animation; its sounds are drawn as
 * the Glass pack's own waveforms; the cells show the newer components, the
 * motion personalities, the sound and the themes. Laid out on the homepage
 * loop's stage (1200 × 675 at 1.6), like v1.
 *
 * Type is the site's: the line in Youj Display, everything else in Geist,
 * labels in sentence case; cue names in Geist Mono, as the home hero's sound
 * plane sets them.
 *
 * The icon tile, the primitives' names and the cue tags are drawn by layout
 * rather than under the camera's transform, so they stay crisp and one size
 * at any magnification. */

const P = HOME_V2.preroll

/* ── The sheet, in stage px ────────────────────────────────────────────── */

const RAIL = { start: 40, end: 1160 }
const RULE = { top: 50, bottom: 625 }
const COL = { a: 356, b: 844 }
const ROW = 338
/** The card, centred in the middle column above its line. */
const CARD = { w: 420, h: 272 }
const CARD_AT = { x: 600 - CARD.w / 2, y: 146 }
/** The icon tile, the canvas and the island on the card, in card px. */
const TILE = { x: 18, y: 18, size: 36, icon: 18 }
const TILE_CENTRE = { x: CARD_AT.x + TILE.x + TILE.size / 2, y: CARD_AT.y + TILE.y + TILE.size / 2 }
const CANVAS = { x: 18, y: 72, w: CARD.w - 36, h: 182 }
const ISLAND_Y = CANVAS.y + CANVAS.h - 14 - 36

/* ── The lens: a stage point shown at the frame's centre, at a scale ──── */

interface Lens {
  scale: number
  x: number
  y: number
}

const REST: Lens = { scale: 1, x: 600, y: 337.5 }
const ON_CARD: Lens = { scale: 2, x: 600, y: CARD_AT.y + CARD.h / 2 }
const ON_ICON: Lens = { scale: 11, x: TILE_CENTRE.x, y: TILE_CENTRE.y }
const ON_ISLAND: Lens = { scale: 2.6, x: 600, y: CARD_AT.y + ISLAND_Y - 14 }

/** Zooms move in log scale, so a push reads at an even rate. */
function between(a: Lens, b: Lens, t: number): Lens {
  return { scale: Math.exp(mix(Math.log(a.scale), Math.log(b.scale), t)), x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) }
}

function lensAt(f: number): Lens {
  let lens = between(REST, ON_CARD, tween(f, P + B.dive, B.diveLength, 'emphasized'))
  lens = between(lens, ON_ICON, tween(f, P + B.iconPush, B.iconPushLength, 'emphasized'))
  lens = between(lens, ON_CARD, tween(f, P + B.iconPull, B.iconPullLength, 'emphasized'))
  lens = between(lens, ON_ISLAND, tween(f, P + B.lean, B.leanLength, 'emphasized'))
  lens = between(lens, ON_CARD, tween(f, P + B.unlean, B.unleanLength, 'emphasized'))
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

/** Where the release is: ready, deploying (the change merging), deployed, or set back. */
const deploying = (f: number) => f >= P + B.press && f < P + B.resolve
const deployed = (f: number) => f >= P + B.resolve && f < P + B.reset

/* ── The theme: the site's own (Basalt in dark, Graphite in light), Terminal for a while, then home again ── */

const home = (scheme: Scheme) => (scheme === 'light' ? 'graphite' : 'basalt')

function Themed({ scheme, children }: { scheme: Scheme; children: ReactNode }) {
  const frame = useFrame()
  const base = useMemo(() => tuningOf(home(scheme), scheme), [scheme])
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

export function HomeFilmV2({ scheme }: { scheme: Scheme }) {
  return (
    <Themed scheme={scheme}>
      <Sheet scheme={scheme} />
    </Themed>
  )
}

/** The light cut's sheet is the docs site's light page (pure white), so the film sits on the home page's canvas; the passing theme still tints it. */
function sitePage(frame: number): CSSProperties {
  const t = tween(frame, P + B.themeIn, B.themeInLength, 'emphasized') - tween(frame, P + B.themeOut, B.themeOutLength, 'emphasized')
  return { backgroundColor: `color-mix(in oklab, oklch(1 0 0) ${(1 - t) * 100}%, var(--color-canvas))` }
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
        <SoundCell />
        <ThemesCell scheme={scheme} />
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
      <Backdrop grid={0.55} glow={scheme === 'dark' ? 0.32 : 0.22} glowAt={{ x: 50, y: 42 }} style={scheme === 'light' ? sitePage(frame) : undefined} />
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
      <CueTags root={root} />
      <Cursor
        start={{ x: 980, y: 720 }}
        size={() => lens.scale * 0.5}
        show={[P + B.reach - 6, P + B.press + 70]}
        moves={[
          { at: P + B.reach, to: find('[data-home=deploy]', 0.6, 0.62), frames: B.press - B.reach - 6, press: 'click', after: 6 },
          { at: P + B.press + 26, to: { x: 1060, y: 760 }, frames: 40 },
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

/** A cell's label, as the site sets labels now: the particle, then the name in sentence case. */
function Eyebrow({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <p className="absolute flex items-center gap-2 text-[12.5px] leading-none font-medium text-fg-muted" style={{ left: x, top: y }}>
      <span aria-hidden className="size-[5px] rounded-[1px] bg-accent" />
      {children}
    </p>
  )
}

/** The line, set as the site sets its display steps: Youj Display, one weight, a hair open. */
function Caption({ show }: { show: number }) {
  if (show <= 0) return null
  return (
    <p
      className="absolute inset-x-0 text-center text-[44px] leading-none text-fg"
      style={{ top: 462, opacity: show, transform: `translateY(${(1 - show) * 8}px)`, fontFamily: "'Youj Display', 'Geist', sans-serif", fontWeight: 400, letterSpacing: '0.005em', fontSynthesis: 'none' }}
    >
      Designed as one.
    </p>
  )
}

/* ── The card ──────────────────────────────────────────────────────────── */

const DEPLOY = illustrations.find((s) => s.id === 'deploy')!.Component
/** The scene at rest is already standing; drafted, it assembles itself as it mounts. It holds still, so the seam is exact. */
const SCENE_AT_REST = <DEPLOY unit={14} float={false} assemble={false} />
const SCENE_DRAFTED = <DEPLOY unit={14} float={false} />

function Card() {
  const frame = useFrame()
  const outline = built(frame, 'outline')
  const radius = built(frame, 'radius')
  const surface = built(frame, 'surface', 36)
  const type = built(frame, 'type', 36)
  const scene = built(frame, 'scene', 24)
  const tile = built(frame, 'icon', 24)
  const badge = landed(frame, 'controls')
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
          <rect x={CANVAS.x + 0.5} y={CANVAS.y + 0.5} width={CANVAS.w - 1} height={CANVAS.h - 1} rx={8} stroke="var(--color-line)" strokeDasharray="3 3" style={{ opacity: lines * (1 - surface) }} />
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
      <div className="absolute" style={{ left: 66, top: 19, opacity: type, transform: `translateY(${(1 - type) * 4}px)` }}>
        <p className="text-[15px] leading-5 font-semibold tracking-[-0.01em] text-fg">Release</p>
        <p className="text-ui-sm text-fg-muted">Everything’s checked. Deploy when you’re ready.</p>
      </div>
      <div className="absolute" style={{ right: 18, top: 22, opacity: badge.show, transform: `scale(${badge.scale})`, transformOrigin: 'right center' }}>
        <ReleaseBadge />
      </div>
      {/* The canvas: the scene stands on it, and the island floats at its foot. */}
      <div
        className="absolute overflow-hidden rounded-lg border border-line-subtle"
        style={{ left: CANVAS.x, top: CANVAS.y, width: CANVAS.w, height: CANVAS.h, opacity: surface, background: 'color-mix(in oklab, var(--color-fg) 3.5%, var(--color-surface))' }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(color-mix(in oklab, var(--color-fg) 16%, transparent) 0.6px, transparent 0.7px)', backgroundSize: '12px 12px', backgroundPosition: 'center' }}
        />
      </div>
      <div className="absolute grid place-items-center" style={{ left: CANVAS.x, top: CANVAS.y - 16, width: CANVAS.w, height: CANVAS.h - 26, opacity: Math.min(1, scene * 4) }}>
        <Scene />
      </div>
      <Merging />
      <div className="absolute inset-x-0 flex justify-center" style={{ top: ISLAND_Y }}>
        <Island />
      </div>
      {/* The tile's place on the card: its surface is drawn by layout (IconTile), over this. */}
      <span aria-hidden className="absolute" style={{ left: TILE.x, top: TILE.y, width: TILE.size, height: TILE.size, opacity: tile }} />
    </div>
  )
}

/** The Deploy scene: standing at rest, gone as the card comes apart, assembling as it's drafted. */
function Scene() {
  const state = useFrameValue((f) => (f < P + B.undo ? 'rest' : f < P + B.build + B.parts.scene ? 'gone' : 'drafted'))
  // It gives the canvas to the merge while the change deploys.
  const show = useFrameValue((f) => Math.round((1 - tween(f, P + B.press, 12, 'exit') + tween(f, P + B.resolve, 16, 'enter')) * 30) / 30)
  if (state === 'gone') return null
  return <div style={{ opacity: show }}>{state === 'rest' ? SCENE_AT_REST : SCENE_DRAFTED}</div>
}

/** While it deploys, the canvas waits on the Offshoot animation (a branch leaves main and merges back), at least one whole loop of it: drawn at three times its size and set down, so its canvas stays sharp under the camera. */
const MERGE = { size: 132, x: CANVAS.x + CANVAS.w / 2, y: CANVAS.y + 64 }
function Merging() {
  const show = useFrameValue((f) => Math.round(Math.min(tween(f, P + B.press + 4, 14, 'enter'), 1 - tween(f, P + B.resolve - 6, 12, 'exit')) * 30) / 30)
  if (show <= 0) return null
  return (
    <div className="absolute text-fg" style={{ left: MERGE.x - MERGE.size / 2, top: MERGE.y - MERGE.size / 2, width: MERGE.size, height: MERGE.size, opacity: show }}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.3333)' }}>
        <LoaderOffshoot size={MERGE.size * 3} label={null} />
      </div>
    </div>
  )
}

/** Ready, then Live once it deploys, until the card sets itself back. */
function ReleaseBadge() {
  const live = useFrameValue((f) => f >= P + B.resolve + 20 && f < P + B.reset + 20)
  return live ? <Badge>Live</Badge> : <Badge variant="secondary">Ready</Badge>
}

/** The release's actions on an ActionIsland: the branch it deploys, Preview, Tell the team (on), and Deploy, the one filled step. */
function Island() {
  const frame = useFrame()
  const tiles = landed(frame, 'controls', 6)
  const deploy = landed(frame, 'accent')
  const ringing = useFrameValue((f) => f >= P + B.notify && f < P + B.notify + 50)
  return (
    <ActionIsland aria-label="Release" style={{ opacity: tiles.show, transform: `scale(${tiles.scale})` }}>
      <ActionIslandMark>
        <GitBranchIcon size={15} strokeWidth={1.75} />
        main
      </ActionIslandMark>
      <ActionIslandGroup>
        <ActionIslandTile label="Preview" tabIndex={-1}>
          <EyeIcon size={16} strokeWidth={1.75} />
        </ActionIslandTile>
        <ActionIslandTile label="Tell the team" pressed tabIndex={-1} data-home="bell">
          <BellIcon size={16} strokeWidth={1.75} active={ringing} trigger="none" />
        </ActionIslandTile>
      </ActionIslandGroup>
      <ActionIslandSeparator />
      <div style={{ opacity: deploy.show, transform: `scale(${deploy.scale})` }}>
        <DeployButton />
      </div>
    </ActionIsland>
  )
}

/**
 * Deploy: the kit Button's own async states, driven frame by frame through `status`: the press, its spinner and
 * pending label while the change merges, then its drawn check and "Deployed", held until the card sets itself back. One fixed width for every state, so the box (and the island round it) never moves;
 * its corners read the theme's live control radius (the async button's box morph would keep the radius it read at mount).
 */
/** Basalt letters its primary action in ink (`actions: 'ink'`); this one takes the accent, as the island's primary tile did, and
 *  so does its success tint, so every state follows a theme pass with the card (each preset's success is its own hue). */
const ACCENT_ACTION = {
  '--yj-action-ink': 0,
  '--action': 'var(--color-accent)',
  '--action-foreground': 'var(--color-on-accent)',
  '--color-action': 'var(--color-accent)',
  '--color-action-foreground': 'var(--color-on-accent)',
  '--color-success': 'var(--color-accent)',
} as CSSProperties
function DeployButton() {
  const status = useFrameValue((f) => (deploying(f) ? 'pending' : deployed(f) ? 'success' : 'idle'))
  return (
    <span data-home="deploy" className="inline-flex" style={ACCENT_ACTION}>
      <AsyncButton size="sm" tabIndex={-1} className="w-[116px] justify-center rounded-control-sm!" status={status} pendingLabel="Deploying" successLabel="Deployed" resetAfter={600_000}>
        <SendIcon size={15} strokeWidth={2} />
        Deploy
      </AsyncButton>
    </span>
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
  // Out of the keyline circle, into the pull request; at rest it is the pull request, and once it deploys it merges.
  const morph = frame < P + B.build ? 1 : tween(frame, P + B.morph, B.morphLength, 'emphasized')
  const merged = tween(frame, P + B.resolve, B.resolveLength, 'emphasized') - tween(frame, P + B.reset, B.resolveLength, 'emphasized')
  return (
    <div
      aria-hidden
      className="absolute"
      style={{ left: c.x - size / 2, top: c.y - size / 2, width: size, height: size, opacity: tile, borderRadius: 9 * scale, background: 'color-mix(in oklab, var(--color-accent) 12%, var(--color-surface))' }}
    >
      {keys > 0 && (
        <div className="absolute" style={{ left: (size - icon) / 2, top: (size - icon) / 2, width: icon, height: icon, opacity: keys }}>
          <Keylines size={icon} hairline={24 / icon} grid={0.5} />
        </div>
      )}
      <div className="absolute grid place-items-center text-accent" style={{ inset: 0 }}>
        {merged > 0 ? (
          <IconSwap from={GitPullRequestIcon} to={GitMergeIcon} progress={merged} transition="morph" size={icon} strokeWidth={1.75} />
        ) : (
          <IconSwap from={CircleIcon} to={GitPullRequestIcon} progress={morph} transition="morph" size={icon} strokeWidth={1.75} />
        )}
      </div>
    </div>
  )
}

/* ── The primitives' names, as the card drafts itself ─────────────────── */

const NAMES: { id: PartId; name: string; at: Point; side: 'start' | 'end'; delay?: number }[] = [
  { id: 'outline', name: 'Layout', at: { x: CARD.w, y: 0 }, side: 'end' },
  { id: 'radius', name: 'Radius', at: { x: 0, y: 0 }, side: 'start' },
  { id: 'surface', name: 'Surface', at: { x: CARD.w, y: 120 }, side: 'end' },
  { id: 'type', name: 'Type', at: { x: 318, y: 47 }, side: 'end' },
  { id: 'scene', name: 'Scene', at: { x: CARD.w / 2 - 40, y: 150 }, side: 'start' },
  // The icon is named once the camera is back from its drawing board.
  { id: 'icon', name: 'Icon', at: { x: TILE.x, y: TILE.y + TILE.size / 2 }, side: 'start', delay: 150 },
  { id: 'controls', name: 'Spring', at: { x: CARD.w / 2 + 6, y: ISLAND_Y + 6 }, side: 'end' },
  { id: 'accent', name: 'Accent', at: { x: CARD.w / 2 + 80, y: ISLAND_Y + 30 }, side: 'end' },
]

function Names({ project, scale }: { project: (p: Point) => Point; scale: number }) {
  const frame = useFrame()
  const out = 1 - tween(frame, P + B.namesOut, 30, 'exit')
  // Only at the card's own close-up: not on the way in, nor at the icon's macro.
  const close = Math.max(0, 1 - Math.abs(Math.log(scale / ON_CARD.scale)) * 3)
  if (frame < P + B.build || out <= 0 || close <= 0) return null
  return (
    <>
      {NAMES.map(({ id, name, at, side, delay = 0 }) => {
        const show = tween(frame, P + B.build + B.parts[id] + delay, 20, 'enter') * out * close
        if (show <= 0) return null
        const anchor = project({ x: CARD_AT.x + at.x, y: CARD_AT.y + at.y })
        // The name sits in the margin; its leader runs from the name to the part.
        const edge = side === 'start' ? 24 : 1176
        const leader = side === 'start' ? { from: edge + 84, to: anchor.x } : { from: anchor.x, to: edge - 84 }
        return (
          <div key={id} className="absolute inset-x-0" style={{ top: anchor.y, opacity: show }}>
            <span aria-hidden className="absolute h-px bg-line-strong" style={{ left: leader.from, width: Math.max(0, leader.to - leader.from) }} />
            <span aria-hidden className="absolute size-[5px] -translate-1/2 rounded-full bg-fg" style={{ left: anchor.x }} />
            <span
              className="absolute flex -translate-y-1/2 items-center gap-1.5 text-[12.5px] leading-none font-medium text-fg"
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

/* ── The sound, drawn and never played ─────────────────────────────────── */

type Cue = 'tap' | 'success' | 'notify'
type Wave = { max: number[]; min: number[] }
const waveOf = (cue: Cue): Wave => GLASS[cue]

/** A cue's waveform as bars on a root scale, as the home hero's sound plane draws it: each bar the loudest it gets in its stretch. */
function peaksOf(cue: Cue, bars = 16) {
  const { max, min } = waveOf(cue)
  const loud = max.map((m, i) => Math.max(m, -min[i]!) / 1000)
  const last = loud.reduce((at, v, i) => (v >= 0.02 ? i : at), 0)
  const heard = loud.slice(0, last + 2)
  return Array.from({ length: bars }, (_, i) => Math.max(...heard.slice(Math.floor((i * heard.length) / bars), Math.max(Math.floor((i * heard.length) / bars) + 1, Math.floor(((i + 1) * heard.length) / bars)))))
}

function Bars({ peaks, height, bar, gap, className, style }: { peaks: number[]; height: number; bar: number; gap: number; className?: string; style?: CSSProperties }) {
  return (
    <svg width={peaks.length * (bar + gap) - gap} height={height} className={`block ${className ?? ''}`} style={style} aria-hidden>
      {peaks.map((peak, i) => {
        const h = Math.max(1.5, Math.sqrt(peak / 0.4) * height)
        return <rect key={i} x={i * (bar + gap)} y={(height - Math.min(h, height)) / 2} width={bar} height={Math.min(h, height)} rx={bar / 2} fill="currentColor" />
      })}
    </svg>
  )
}

/** When each of the card's cues sounds, and the part it sounds from (a selector) with where its tag hangs above it. */
const CUES: { cue: Cue; at: number; from: string; rise: number }[] = [
  { cue: 'tap', at: B.press, from: '[data-home=deploy]', rise: 46 },
  { cue: 'success', at: B.resolve, from: '[data-home=deploy]', rise: 84 },
  { cue: 'notify', at: B.notify, from: '[data-home=bell]', rise: 46 },
]
const LIT = 66
const SWEEP = 26

/** Over the island, each cue's waveform hangs on a dotted leader from the part that makes it, and lights as it sounds. */
function CueTags({ root }: { root: { current: HTMLDivElement | null } }) {
  const frame = useFrame()
  const shown = tween(frame, P + B.press - 14, 14, 'enter') * (1 - tween(frame, P + B.unlean, 30, 'exit'))
  if (shown <= 0 || !root.current) return null
  const host = root.current.getBoundingClientRect()
  const zoom = host.width / 1200
  return (
    <>
      {CUES.map(({ cue, at, from, rise }) => {
        const since = frame - P - at
        const show = shown * tween(frame, P + at - 10, 12, 'enter')
        const el = root.current!.querySelector(from)
        if (show <= 0 || !el) return null
        const r = el.getBoundingClientRect()
        const x = (r.left - host.left + r.width / 2) / zoom
        const y = (r.top - host.top) / zoom
        const lit = since >= 0 && since < LIT
        const sweep = lit ? Math.min(1, since / SWEEP) : 1
        const glow = lit ? (since < SWEEP ? 1 : 1 - (since - SWEEP) / (LIT - SWEEP)) : 0
        const ring = (k: number) => {
          const u = (since - k * 8) / 40
          return u >= 0 && u <= 1 ? { r: 4 + u * 22, o: (1 - u) * 0.7 } : null
        }
        return (
          <div key={cue} className="absolute" style={{ left: 0, top: 0, opacity: show }}>
            <svg aria-hidden className="absolute overflow-visible" style={{ left: 0, top: 0 }} width={1} height={1} fill="none">
              <path d={`M${x} ${y - 2}L${x} ${y - rise + 10}`} stroke="var(--color-line-strong)" strokeDasharray="1.5 2.5" />
              {[0, 1].map((k) => {
                const o = ring(k)
                return o && <circle key={k} cx={x} cy={y + r.height / zoom / 2} r={o.r} stroke="var(--color-accent)" opacity={o.o} />
              })}
              <circle cx={x} cy={y - 2} r={2.25} fill="var(--color-accent)" />
            </svg>
            <div
              className="absolute flex -translate-x-1/2 -translate-y-full items-center gap-2 rounded-[7px] border bg-canvas py-1 ps-1.5 pe-2 shadow-[0_6px_16px_-10px_rgb(0_0_0/0.4)]"
              style={{ left: x, top: y - rise + 10, borderColor: `color-mix(in oklab, var(--color-accent) ${glow * 100}%, var(--color-line-strong))` }}
            >
              <span className="relative grid [&>*]:col-start-1 [&>*]:row-start-1">
                <Bars peaks={TAG_PEAKS[cue]} height={14} bar={2} gap={1.5} className="text-fg-muted" />
                <Bars peaks={TAG_PEAKS[cue]} height={14} bar={2} gap={1.5} className="text-accent" style={{ clipPath: `inset(0 ${(1 - sweep) * 100}% 0 0)`, opacity: glow }} />
              </span>
              <span className="font-mono text-[10.5px] leading-none text-fg">{cue}</span>
            </div>
          </div>
        )
      })}
    </>
  )
}

const TAG_PEAKS: Record<Cue, number[]> = { tap: peaksOf('tap'), success: peaksOf('success'), notify: peaksOf('notify') }

/* ── The cells around it ───────────────────────────────────────────────── */

const VIEWS = ['Overview', 'Activity', 'Members']
const TEAM = [
  { id: 'mira', name: 'Mira Chen' },
  { id: 'jonas', name: 'Jonas Weber' },
  { id: 'ines', name: 'Inês Duarte' },
]
/** A month of a service's days, oldest first: up, but for one slow day. */
const DAYS: UptimeDay[] = Array.from({ length: 30 }, (_, i) => ({ date: `2026-09-${String(i + 1).padStart(2, '0')}`, uptime: i === 17 ? 0.995 : 1 }))
const CELL_W = COL.a - RAIL.start - 40

function ComponentsCell() {
  const view = useFrameValue((f) => (f >= P + B.glides[0]! && f < P + B.glides[1]! ? 'activity' : 'overview'))
  const x = RAIL.start + 20
  return (
    <>
      <Eyebrow x={x} y={RULE.top + 20}>
        Components
      </Eyebrow>
      <div className="absolute" style={{ left: x, top: RULE.top + 50 }}>
        <SegmentedControl value={view} aria-label="View">
          {VIEWS.map((label) => (
            <SegmentedControlItem key={label} value={label.toLowerCase()} tabIndex={-1}>
              {label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>
      <div className="absolute" style={{ left: x, top: RULE.top + 112, width: CELL_W }}>
        <HistoryStrip days={DAYS} size="sm" interactive={false} />
      </div>
      <div className="absolute flex items-center gap-3" style={{ left: x, top: RULE.top + 172 }}>
        <AvatarStack users={TEAM} max={TEAM.length} size="sm" label="Team" />
        <Button variant="outline" size="sm" tabIndex={-1}>
          <UserPlusIcon size={14} strokeWidth={1.75} />
          Invite
        </Button>
      </div>
    </>
  )
}

/** The settle spring as each personality values it, through Motion's own generator, over the same second. */
const PLOT = { x: RAIL.start + 20, y: ROW + 52, w: CELL_W, h: 160 }
const SPRING_SECONDS = 0.9
const PERSONALITIES: { id: MotionPersonality; name: string; stroke: string }[] = [
  { id: 'calm', name: 'Calm', stroke: 'var(--color-fg-muted)' },
  { id: 'precise', name: 'Precise', stroke: 'var(--color-fg)' },
  { id: 'lively', name: 'Lively', stroke: 'var(--color-accent)' },
]
type Generator = { next: (ms: number) => { value: number; done: boolean } }
const generators = Object.fromEntries(
  PERSONALITIES.map(({ id }) => {
    const { visualDuration, bounce } = motionPersonalities[id].springs.settle
    return [id, motionSpring({ keyframes: [0, 1], visualDuration, bounce }) as unknown as Generator]
  }),
) as Record<MotionPersonality, Generator>
const settleAt = (id: MotionPersonality, t: number) => {
  const state = generators[id].next(t * SPRING_SECONDS * 1000)
  return state.done ? 1 : state.value
}
const plotX = (t: number) => t * PLOT.w
const plotY = (v: number) => PLOT.h - 16 - v * (PLOT.h - 52)
const CURVES = Object.fromEntries(
  PERSONALITIES.map(({ id }) => [id, `M ${Array.from({ length: 121 }, (_, i) => `${plotX(i / 120).toFixed(2)} ${plotY(settleAt(id, i / 120)).toFixed(2)}`).join(' L ')}`]),
) as Record<MotionPersonality, string>

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
        {PERSONALITIES.map(({ id, stroke }) => (
          <path key={id} d={CURVES[id]} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
        ))}
        {playing && (
          <g style={{ opacity: fade }}>
            <line x1={plotX(t)} y1={0} x2={plotX(t)} y2={PLOT.h - 16} stroke="var(--color-line-strong)" />
            {PERSONALITIES.map(({ id, stroke }) => (
              <circle key={id} cx={plotX(t)} cy={plotY(settleAt(id, t))} r={3.5} fill={stroke} />
            ))}
          </g>
        )}
      </svg>
      <p className="absolute flex gap-4 text-[11.5px] leading-none text-fg-muted" style={{ left: PLOT.x, top: PLOT.y + PLOT.h + 4 }}>
        {PERSONALITIES.map(({ id, name, stroke }) => (
          <span key={id} className="flex items-center gap-1.5">
            <span aria-hidden className="h-[1.5px] w-3" style={{ background: stroke }} />
            {name}
          </span>
        ))}
        <span className="font-mono text-[10.5px] text-fg-subtle">settle</span>
      </p>
    </>
  )
}

/** The card's three cues on a strip of tape, on one time axis and one amplitude scale. */
const TAPE = { x: COL.b + 20, y: RULE.top + 126, w: RAIL.end - COL.b - 40, amp: 50 }
const TAPE_SECONDS = 1.3
const ON_TAPE: { cue: Cue; at: number }[] = [
  { cue: 'tap', at: 0.06 },
  { cue: 'success', at: 0.3 },
  { cue: 'notify', at: 0.84 },
]
const tapeX = (s: number) => (s / TAPE_SECONDS) * TAPE.w

/** A cue's envelope as one closed path: the highest sample in each sliver along the top, the lowest back along the bottom. */
function envelope(cue: Cue, start: number) {
  const { max, min } = waveOf(cue)
  const step = 4
  const top: string[] = []
  const bottom: string[] = []
  for (let i = 0; i < max.length; i += step) {
    const x = tapeX(start + i / CUE_BINS).toFixed(2)
    // On a root scale, as the home hero's sound plane draws its cues, so a decay keeps a shape at this size.
    const hi = Math.sqrt(Math.max(0, ...max.slice(i, i + step)) / 1000)
    const lo = -Math.sqrt(-Math.min(0, ...min.slice(i, i + step)) / 1000)
    top.push(`${x} ${(-hi * TAPE.amp).toFixed(2)}`)
    bottom.unshift(`${x} ${(-lo * TAPE.amp).toFixed(2)}`)
  }
  return `M ${top.join(' L ')} L ${bottom.join(' L ')} Z`
}
const ENVELOPES = ON_TAPE.map(({ cue, at }) => ({ cue, at, d: envelope(cue, at), x: tapeX(at) }))

function SoundCell() {
  const frame = useFrame()
  const run = (frame - P - B.playhead) / B.playheadLength
  const t = Math.min(1, Math.max(0, run)) * TAPE_SECONDS
  const playing = run > 0 && run < 1.25
  const fade = run < 1 ? 1 : Math.max(0, 1 - (run - 1) * 4)
  return (
    <>
      <Eyebrow x={COL.b + 20} y={RULE.top + 20}>
        Sound
      </Eyebrow>
      <svg aria-hidden className="absolute overflow-visible" style={{ left: TAPE.x, top: TAPE.y }} width={TAPE.w} height={1} fill="none">
        <line x1={0} y1={0} x2={TAPE.w} y2={0} stroke="var(--color-line)" />
        {ENVELOPES.map(({ cue, at, d, x }) => {
          // Lit in the accent as the playhead reaches it, draining back to the score's grey.
          const since = playing ? t - at : -1
          const glow = since < 0 ? 0 : Math.max(0, 1 - since / 0.55)
          return (
            <g key={cue}>
              <path d={d} fill={`color-mix(in oklab, var(--color-accent) ${glow * 100}%, color-mix(in oklab, var(--color-fg) 46%, transparent))`} />
              <line x1={x} y1={TAPE.amp * 0.62} x2={x} y2={TAPE.amp * 0.62 + 6} stroke="var(--color-line-strong)" />
            </g>
          )
        })}
        {playing && <line x1={tapeX(t)} y1={-TAPE.amp * 0.75} x2={tapeX(t)} y2={TAPE.amp * 0.75} stroke="var(--color-fg)" style={{ opacity: fade }} />}
      </svg>
      {ENVELOPES.map(({ cue, x }) => (
        <p key={cue} className="absolute font-mono text-[10.5px] leading-none text-fg-muted" style={{ left: TAPE.x + x, top: TAPE.y + TAPE.amp * 0.62 + 12 }}>
          {cue}
        </p>
      ))}
    </>
  )
}

const PRESETS = [
  { id: 'basalt', name: 'Basalt' },
  { id: 'graphite', name: 'Graphite' },
  { id: 'terminal', name: 'Terminal' },
  { id: 'brutal', name: 'Brutal' },
] as const

function ThemesCell({ scheme }: { scheme: Scheme }) {
  const preset = useFrameValue((f) => (f >= P + B.themeIn && f < P + B.themeOut ? 'terminal' : home(scheme)))
  const x = COL.b + 20
  return (
    <>
      <Eyebrow x={x} y={ROW + 20}>
        Themes
      </Eyebrow>
      <div className="absolute" style={{ left: x, top: ROW + 52 }}>
        <SegmentedControl value={preset} aria-label="Theme">
          {PRESETS.map((p) => (
            <SegmentedControlItem key={p.id} value={p.id} tabIndex={-1} className="px-2.5">
              {p.name}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>
      <div className="absolute flex items-end gap-4" style={{ left: x, top: ROW + 120 }}>
        <span className="text-[56px] leading-[0.9] text-fg" style={{ fontFamily: "'Youj Display', 'Geist', sans-serif", fontWeight: 400, fontSynthesis: 'none' }}>
          Aa
        </span>
        <div className="flex gap-2 pb-1">
          {['var(--color-canvas)', 'var(--color-surface)', 'var(--color-fg)', 'var(--color-accent)'].map((color) => (
            <span key={color} className="size-8 rounded-(--yj-radius) border border-line-strong" style={{ background: color }} />
          ))}
        </div>
      </div>
    </>
  )
}
