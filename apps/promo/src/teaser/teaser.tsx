import { useMemo, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { ThemeScope } from '@youj/core'
import { internalPresetById } from '@youj/core/lib/youj/theme'
import { PresenceItem, PresenceList, ScrambleText } from '@youj/motion'
import {
  LoaderArmature,
} from '@youj/loaders/armature'
import {
  LoaderCasement,
} from '@youj/loaders/casement'
import {
  LoaderChordal,
} from '@youj/loaders/chordal'
import {
  LoaderChorus,
} from '@youj/loaders/chorus'
import {
  LoaderHalite,
} from '@youj/loaders/halite'
import {
  LoaderPhosphor,
} from '@youj/loaders/phosphor'
import {
  LoaderQuire,
} from '@youj/loaders/quire'
import {
  LoaderRefine,
} from '@youj/loaders/refine'
import {
  LoaderRidge,
} from '@youj/loaders/ridge'
import {
  LoaderSustain,
} from '@youj/loaders/sustain'
import {
  LoaderTempo,
} from '@youj/loaders/tempo'
import {
  LoaderVerdict,
} from '@youj/loaders/verdict'
import {
  LoaderVitals,
} from '@youj/loaders/vitals'
import { YoujLockup } from '@youj/core/docs/brand/youj-logo'
import {
  icons,
  IconSwap,
  LayersIcon,
  LayoutGridIcon,
  LayoutListIcon,
  LockIcon,
  LockOpenIcon,
  MenuIcon,
  MonitorIcon,
  MoonIcon,
  SendIcon,
  ShareIcon,
  SunIcon,
  WifiIcon,
  WifiOffIcon,
  XIcon,
  type YoujIconComponent,
} from '@youj/icons'
import { Button } from '@youj/react/components/ui/button'
import { AsyncButton } from '@youj/react/components/ui/async-button'
import { Card } from '@youj/react/components/ui/card'
import { Progress } from '@youj/react/components/ui/progress'
import { Slider } from '@youj/react/components/ui/slider'
import { Switch } from '@youj/react/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@youj/react/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@youj/react/components/ui/toggle-group'
import { mix, tween } from '../lib/timing'
import { Seq, useFrame, useFrameValue } from '../sim/simulation'
import { Backdrop } from '../film/backdrop'
import { Camera } from '../film/camera'
import { Keylines } from '../film/keylines'
import { ANIMS, BEAT, BOARD, LOOKS, MORPHS, T, TEASER_FPS, shotSpan, type AnimId, type LookId, type ShotKey } from './beats'
import { bandMask, glitchAt, GlitchFilter, glitchStyle, Scanlines, STAGE } from './glitch'

/* The launch teaser, "Signal" (beats.ts has the story, TEASER.md the shot
 * list). Laid out on the film's wide stage (1440 × 810 at 4/3, 1920 × 1080).
 *
 * Every shot is a copy of the library's own rendering in its own look (a
 * preset, a component style and a mode, through ThemeScope), stacked in one
 * frame. A frame shows one of them, and during a glitch a second one
 * through the torn bands; copies share every state through the frame, so
 * wherever a tear splits them they agree. The rack's copies stay mounted
 * from before its first frame to the end of the overload, so a layout
 * animation in flight (a tab indicator, the list re-sorting) is in flight
 * in every look at once. */

const { width: W, height: H } = STAGE

/* ── Looks ─────────────────────────────────────────────────────────────── */

function Look({ id, children }: { id: LookId; children: ReactNode }) {
  const look = LOOKS[id]
  const theme = useMemo(() => internalPresetById(look.preset), [look.preset])
  return (
    <div data-theme={look.scheme} className="absolute inset-0 overflow-hidden">
      <ThemeScope theme={theme} look={look.style}>
        <div className="absolute inset-0 bg-canvas font-sans text-fg">{children}</div>
      </ThemeScope>
    </div>
  )
}

/* ── I · Tune in ───────────────────────────────────────────────────────── */

function Tune() {
  const frame = useFrame()
  const line = tween(frame, T.tune.line, T.tune.lineLength, 'emphasized')
  const open = tween(frame, T.tune.open, T.tune.openLength, 'enter')
  const lock = tween(frame, T.tune.open, T.tune.lock - T.tune.open, 'emphasized')
  // The picture opens out of the beam; until it's open, a sliver at least.
  const gap = (1 - open) * 50
  const beam = line * (1 - tween(frame, T.tune.open + 4, 12, 'exit'))
  // The vertical hold catches: the picture rolls up into place as it locks.
  const roll = (1 - lock) * 46
  return (
    <>
      {frame >= T.tune.open && (
        <div className="absolute inset-0" style={{ clipPath: `inset(${gap.toFixed(3)}% 0 ${gap.toFixed(3)}% 0)` }}>
          <div className="absolute inset-0 grid place-items-center" style={{ transform: `translateY(${roll}px)` }}>
            <LoaderPhosphor size={620} label={null} />
          </div>
        </div>
      )}
      {beam > 0 && (
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 h-[2px] -translate-1/2 rounded-full"
          style={{
            width: `${line * 100}%`,
            opacity: beam,
            background: 'color-mix(in oklab, var(--color-fg) 82%, var(--color-accent))',
            boxShadow: '0 0 18px 2px color-mix(in oklab, var(--color-accent) 55%, transparent)',
          }}
        />
      )}
    </>
  )
}

/* ── II · The kit, re-themed ───────────────────────────────────────────── */

const R = T.rack
/** A tile on the rack, in CSS px at 1:1 (the camera magnifies the whole rack). */
/* Wide enough for the widest part in every look: Bezel gives each key of a track (the icon tabs, the segmented
 * control) a label's inline padding, so three icon keys make a 127px track, against about 101 in Classic. */
const TILE = { w: 156, h: 96, gap: 10 }

function Tile({ children }: { children: ReactNode }) {
  return (
    <Card className="grid place-items-center gap-0 p-0" style={{ width: TILE.w, height: TILE.h }}>
      {children}
    </Card>
  )
}

function RackSwitch() {
  const on = useFrameValue((f) => f >= R.switchOn && f < R.switchOff)
  return <Switch checked={on} tabIndex={-1} aria-label="Signal" />
}

function RackButton() {
  const status = useFrameValue((f) => (f < R.press ? 'idle' : f < R.success ? 'pending' : 'success'))
  return (
    <div className="flex items-center gap-2.5">
      <Button size="icon-lg" variant="outline" tabIndex={-1} aria-label="Share">
        <ShareIcon />
      </Button>
      <AsyncButton size="icon-lg" status={status} resetAfter={60_000} tabIndex={-1} aria-label="Send">
        <SendIcon />
      </AsyncButton>
    </div>
  )
}

const TAB_ICONS = [
  { value: 'grid', Icon: LayoutGridIcon },
  { value: 'list', Icon: LayoutListIcon },
  { value: 'layers', Icon: LayersIcon },
]

function RackTabs() {
  const value = useFrameValue((f) => TAB_ICONS[R.tabs.filter((at) => f >= at).length]!.value)
  return (
    <Tabs value={value}>
      <TabsList variant="pill">
        {TAB_ICONS.map(({ value: v, Icon }) => (
          <TabsTrigger key={v} value={v} tabIndex={-1} aria-label={v} className="px-2.5">
            <Icon size={15} />
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

function RackSlider() {
  const value = useFrameValue((f) => Math.round(mix(22, 78, tween(f, R.slide, R.slideLength, 'emphasized')) * 10) / 10)
  return (
    <div className="w-[88px]">
      <Slider value={[value]} min={0} max={100} tabIndex={-1} aria-label="Level" />
    </div>
  )
}

const ROWS = [
  { id: 'a', value: 34 },
  { id: 'b', value: 82 },
  { id: 'c', value: 57 },
  { id: 'd', value: 18 },
]
const SORTED = [...ROWS].sort((a, b) => b.value - a.value)

function RackSort() {
  const sorted = useFrameValue((f) => f >= R.sort)
  return (
    <PresenceList className="flex w-[88px] flex-col gap-[6px]">
      {(sorted ? SORTED : ROWS).map((row) => (
        <PresenceItem key={row.id} className="flex items-center gap-2">
          <span aria-hidden className="size-[7px] shrink-0 rounded-[2px] bg-accent" style={{ opacity: 0.35 + row.value / 140 }} />
          <Progress value={row.value} aria-label={row.id} className="flex-1" />
        </PresenceItem>
      ))}
    </PresenceList>
  )
}

function RackSegment() {
  const value = useFrameValue((f) => (f >= R.segment ? 'moon' : 'sun'))
  return (
    <ToggleGroup variant="segmented" value={[value]} aria-label="Mode">
      <ToggleGroupItem value="sun" tabIndex={-1} aria-label="Light">
        <SunIcon size={15} />
      </ToggleGroupItem>
      <ToggleGroupItem value="moon" tabIndex={-1} aria-label="Dark">
        <MoonIcon size={15} />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" tabIndex={-1} aria-label="System">
        <MonitorIcon size={15} />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

const RACK = (
  <div className="absolute inset-0 grid place-items-center">
    <div className="grid grid-cols-3" style={{ gap: TILE.gap }}>
      <Tile>
        <RackSwitch />
      </Tile>
      <Tile>
        <RackButton />
      </Tile>
      <Tile>
        <RackTabs />
      </Tile>
      <Tile>
        <RackSort />
      </Tile>
      <Tile>
        <RackSlider />
      </Tile>
      <Tile>
        <RackSegment />
      </Tile>
    </div>
  </div>
)

function Rack() {
  const frame = useFrame()
  // A slow push in across the beat, the rack about nine tenths of the frame wide.
  const scale = mix(2.62, 2.76, tween(frame, R.from, R.to - R.from, 'standard'))
  return (
    <>
      <Backdrop grid={0.45} glow={0.28} glowAt={{ x: 50, y: 50 }} />
      <Camera shot={{ scale, x: 0, y: 0 }}>{RACK}</Camera>
    </>
  )
}

/* ── III · Icons ───────────────────────────────────────────────────────── */

const I = T.icons
const WALL = { cols: 27, pitch: 46, icon: 20 }
const MORPH_ICONS: Record<string, YoujIconComponent> = {
  'wifi-off': WifiOffIcon,
  wifi: WifiIcon,
  moon: MoonIcon,
  sun: SunIcon,
  lock: LockIcon,
  'lock-open': LockOpenIcon,
  menu: MenuIcon,
  x: XIcon,
}
const SET = icons.filter((icon) => !Object.values(MORPH_ICONS).includes(icon))
const WALL_ROWS = Math.ceil((SET.length + 1) / WALL.cols)
const CENTRE = { row: Math.floor(WALL_ROWS / 2), col: Math.floor(WALL.cols / 2) }
/** The set in a stable, well-mixed order, with the close-up's board in the middle. */
const CELLS: (YoujIconComponent | null)[] = (() => {
  const mixed = SET.map((icon, i) => ({ icon, key: (i * 7919) % SET.length }))
    .sort((a, b) => a.key - b.key)
    .map(({ icon }) => icon)
  const at = CENTRE.row * WALL.cols + CENTRE.col
  return [...mixed.slice(0, at), null, ...mixed.slice(at)]
})()
const cellCentre = (row: number, col: number) => ({
  x: W / 2 + (col - CENTRE.col) * WALL.pitch,
  y: H / 2 + (row - CENTRE.row) * WALL.pitch,
})
/** The board at macro, about half the frame's height. */
const MACRO = 440 / WALL.icon
const WHOLE = Math.max(W / ((WALL.cols - 1) * WALL.pitch + WALL.icon * 2), H / ((WALL_ROWS - 1) * WALL.pitch + WALL.icon * 2))

function lensScale(frame: number) {
  const pull = tween(frame, I.pull, I.pullLength, 'emphasized')
  const scale = Math.exp(mix(Math.log(MACRO), Math.log(WHOLE), pull))
  return scale * (1 + 0.035 * tween(frame, I.pull + I.pullLength, I.to - I.pull - I.pullLength + 40, 'standard'))
}

function IconsShot() {
  const frame = useFrame()
  const scale = lensScale(frame)
  const size = WALL.icon * scale
  const m = Math.min(MORPHS.length - 1, Math.max(0, Math.floor((frame - I.from) / BEAT)))
  const morph = MORPHS[m]!
  const progress = tween(frame, I.from + m * BEAT + I.morphDelay, I.morphLength, 'emphasized')
  const keys = 1 - tween(frame, I.pull, I.pullLength * 0.5, 'exit')
  const pulled = frame >= I.pull
  const project = (row: number, col: number) => {
    const c = cellCentre(row, col)
    return { x: W / 2 + (c.x - W / 2) * scale, y: H / 2 + (c.y - H / 2) * scale }
  }
  const board = project(CENTRE.row, CENTRE.col)
  return (
    <>
      <Backdrop grid={pulled ? 0.3 : 0} glow={0.22} glowAt={{ x: 50, y: 50 }} />
      {keys > 0 && (
        <div className="absolute" style={{ left: board.x - size / 2, top: board.y - size / 2, width: size, height: size, opacity: keys }}>
          <Keylines size={size} hairline={24 / size} grid={0.55} />
        </div>
      )}
      <span className="absolute grid place-items-center text-accent" style={{ left: board.x - size / 2, top: board.y - size / 2, width: size, height: size }}>
        <IconSwap from={MORPH_ICONS[morph.from]!} to={MORPH_ICONS[morph.to]!} progress={progress} transition="morph" size={size} strokeWidth={1.5} />
      </span>
      {pulled && <Wall scale={scale} project={project} size={size} />}
    </>
  )
}

function Wall({ scale, project, size }: { scale: number; project: (row: number, col: number) => { x: number; y: number }; size: number }) {
  const margin = size
  return (
    <>
      {CELLS.map((Icon, i) => {
        if (!Icon) return null
        const row = Math.floor(i / WALL.cols)
        const col = i % WALL.cols
        const c = project(row, col)
        if (c.x < -margin || c.x > W + margin || c.y < -margin || c.y > H + margin) return null
        const distance = Math.hypot(row - CENTRE.row, col - CENTRE.col)
        return <WaveIcon key={i} Icon={Icon} x={c.x} y={c.y} size={size} at={I.wave + distance * 3.2} scale={scale} />
      })}
    </>
  )
}

function WaveIcon({ Icon, x, y, size, at }: { Icon: YoujIconComponent; x: number; y: number; size: number; at: number; scale: number }) {
  const active = useFrameValue((f) => f >= at && f < at + 44)
  const front = useFrameValue((f) => Math.round(Math.max(0, 1 - Math.abs(f - at - 6) / 12) * 10) / 10)
  return (
    <span
      className="absolute grid place-items-center"
      style={{ left: x - size / 2, top: y - size / 2, width: size, height: size, color: `color-mix(in oklab, var(--color-accent) ${front * 100}%, var(--color-fg-muted))` }}
    >
      <Icon size={size} strokeWidth={1.5} active={active} trigger="none" />
    </span>
  )
}

/* ── IV · The gallery ──────────────────────────────────────────────────── */

const ANIM_PARTS: Record<AnimId, { Component: ComponentType<{ size: number; label: null; speed?: number }>; size: number }> = {
  chordal: { Component: LoaderChordal, size: 700 },
  casement: { Component: LoaderCasement, size: 680 },
  sustain: { Component: LoaderSustain, size: 700 },
  halite: { Component: LoaderHalite, size: 700 },
  verdict: { Component: LoaderVerdict, size: 680 },
  ridge: { Component: LoaderRidge, size: 720 },
  armature: { Component: LoaderArmature, size: 700 },
  quire: { Component: LoaderQuire, size: 680 },
  tempo: { Component: LoaderTempo, size: 680 },
  chorus: { Component: LoaderChorus, size: 680 },
  refine: { Component: LoaderRefine, size: 700 },
  vitals: { Component: LoaderVitals, size: 600 },
}

function AnimShot({ id }: { id: AnimId }) {
  const { Component, size } = ANIM_PARTS[id]
  return (
    <>
      <Backdrop grid={0.3} glow={0.24} glowAt={{ x: 50, y: 50 }} />
      <div className="absolute inset-0 grid place-items-center">
        <Component size={size} label={null} speed={1.4} />
      </div>
    </>
  )
}

/* ── V · The signal drops; the wordmark ────────────────────────────────── */

const OFF = T.off

function Off() {
  const frame = useFrame()
  const shrink = tween(frame, OFF.line, OFF.lineLength, 'emphasized')
  const fade = tween(frame, OFF.dot, OFF.dotLength, 'exit')
  const width = mix(W, 6, shrink)
  const height = mix(2, 6, shrink)
  if (fade >= 1) return null
  return (
    <div
      aria-hidden
      className="absolute top-1/2 left-1/2 -translate-1/2"
      style={{
        width,
        height,
        opacity: 1 - fade,
        background: `color-mix(in oklab, var(--color-fg) ${(1 - shrink) * 85}%, var(--color-accent))`,
        boxShadow: '0 0 16px 2px color-mix(in oklab, var(--color-accent) 50%, transparent)',
      }}
    />
  )
}

const LOGO = T.logo
const URL_GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789'

function Logo() {
  return (
    <>
      <Backdrop grid={0.28} glow={0.2} glowAt={{ x: 50, y: 47 }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-11">
        <div className="h-[150px]">
          <Seq from={LOGO.at}>
            <YoujLockup animated optical="display" className="text-[150px] text-fg" />
          </Seq>
        </div>
        <div className="h-6 font-mono text-[22px] leading-6 tracking-[0.06em] text-fg-muted">
          <Seq from={LOGO.url}>
            <ScrambleText glyphs={URL_GLYPHS} tick="fast" duration="slow">
              youj.dev
            </ScrambleText>
          </Seq>
        </div>
      </div>
    </>
  )
}

/* ── The frame ─────────────────────────────────────────────────────────── */

const ANIM_LOOK = Object.fromEntries(ANIMS.map((a) => [a.id, a.look])) as Record<AnimId, LookId>
const RACK_LOOKS = Object.keys(LOOKS) as LookId[]
const ICON_LOOKS = MORPHS.map((m) => m.look)

/** Every shot in the film, in a look, with the frames it's mounted for. */
function useShots() {
  return useMemo(() => {
    const shots: { key: ShotKey; node: ReactNode; span: [number, number] }[] = []
    const rack = (look: LookId) => {
      const key = `rack:${look}` as ShotKey
      // Mounted from before the rack's first frame to the end of the overload, in every look, so layout animations agree.
      shots.push({ key, span: [R.from - 30, T.overload.to + 8], node: <Look id={look}>{<Rack />}</Look> })
    }
    shots.push({ key: 'tune', span: shotSpan('tune'), node: <Look id="basalt">{<Tune />}</Look> })
    RACK_LOOKS.forEach(rack)
    for (const look of ICON_LOOKS) shots.push({ key: `icons:${look}`, span: shotSpan(`icons:${look}`), node: <Look id={look}>{<IconsShot />}</Look> })
    for (const { id } of ANIMS) {
      const [from, to] = shotSpan(`anim:${id}`)
      // Each one runs for a while before it cuts in, so it arrives mid-motion.
      shots.push({ key: `anim:${id}`, span: [from - 40, to], node: <Look id={ANIM_LOOK[id]}>{<AnimShot id={id} />}</Look> })
    }
    shots.push({ key: 'off', span: shotSpan('off'), node: <Look id="basalt">{<Off />}</Look> })
    shots.push({ key: 'logo', span: shotSpan('logo'), node: <Look id="basalt">{<Logo />}</Look> })
    return shots
  }, [])
}

export function Teaser({ board = false }: { board?: boolean }) {
  const frame = useFrame()
  const shots = useShots()
  const state = glitchAt(frame)

  // The picture collapses into the line as the signal drops.
  const collapse = tween(frame, OFF.collapse, OFF.collapseLength, 'exit')
  const collapsed: CSSProperties =
    collapse > 0 && frame < OFF.line
      ? { transform: `scale(${mix(1, 1.04, collapse)}, ${mix(1, 0.004, collapse)})`, filter: `${glitchStyle(state).filter ?? ''} brightness(${mix(1, 2.2, collapse)})`.trim() }
      : glitchStyle(state)

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <GlitchFilter state={state} />
      <div className="absolute inset-0" style={collapsed}>
        {shots.map(({ key, node, span }) => {
          if (frame < span[0] || frame >= span[1]) return null
          const role = key === state.base ? 'base' : key === state.over ? 'over' : 'hidden'
          const style: CSSProperties =
            role === 'base' ? { zIndex: 1 } : role === 'over' ? { zIndex: 2, ...bandMask(state.bands) } : { visibility: 'hidden' }
          return (
            <div key={key} data-shot={key} className="absolute inset-0" style={style}>
              {node}
            </div>
          )
        })}
      </div>
      <Scanlines power={state.power} />
      {board && <BoardLabel frame={frame} />}
    </div>
  )
}

/** The storyboard's caption: the timecode and the beat, burnt into the still (only for the board). */
function BoardLabel({ frame }: { frame: number }) {
  const beat = BOARD.find((b) => b.frame === frame)?.beat ?? ''
  const seconds = frame / TEASER_FPS
  const code = `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(2).padStart(5, '0')} · f${frame}`
  return (
    <div className="absolute start-4 bottom-4 z-10 flex items-center gap-3 rounded-md bg-black/85 px-3 py-2 font-mono text-[22px] leading-none text-white">
      <span className="text-yellow-300">{code}</span>
      <span>{beat}</span>
    </div>
  )
}

