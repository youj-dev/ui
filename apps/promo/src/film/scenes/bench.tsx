import { memo, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { YoujProvider, motionPersonalities, type MotionPersonality } from '@youj/core'
import { type AsyncState } from '@youj/motion'
import { Button } from '@youj/react/components/ui/button'
import { Kbd, KbdGroup } from '@youj/react/components/ui/kbd'
import { toast } from '@youj/react/components/ui/toast'
import { during, mix, spring, tween } from '../../lib/timing'
import { useAction, useFrame, useFrameValue } from '../../sim/simulation'
import {
  ASSEMBLE_BEATS as A,
  BUTTON_BEATS,
  COMMAND_BEATS,
  GLIDE,
  PARTS,
  PARTS_BEATS as S,
  POPOVER_BEATS,
  TABLE_BEATS,
  TABS_BEATS,
  TOAST_BEATS,
} from '../beats'
import { Camera } from '../camera'
import { Cursor, type Point } from '../cursor'
import { useFormat, type Format } from '../format'
import { ShotLabel } from '../label'
import { CodePart, Commands, InvitePart, RequirePart, SavePart, SessionsPart, TABLE_WIDTH, TabsPart, TimeoutPart } from './parts'

/* The components, on one bench, then in one block.
 *
 * Every part is mounted once, laid out on a bench in camera space, far
 * enough apart that at macro only one is in frame. The camera (see
 * camera.tsx: the parts' own layout animations are measured through it)
 * visits them one at a time, locked off while each does its thing, and
 * travels to the next by stepping back, crossing and pushing in again:
 * Save runs its async lifecycle, the tabs' hover pill follows the pointer
 * and the underline glides, Invite grows a popover out of its corner
 * (portaled into the camera, so the lens magnifies it with its trigger), the
 * toasts stack (the film's Toaster, zoomed to the lens), the code verifies,
 * the sessions re-sort, the camera steps back to the whole page for ⌘K,
 * which signs a session out, and the timeout control and the 2FA switch
 * play in three motion personalities, lane above lane like a timing chart,
 * before reduced motion joins them. Then the camera pulls back to the whole
 * bench and the parts fly into the Security block, each landing on the
 * settle spring, and the block's own chrome draws in around them. The
 * themes chapter takes the block from there.
 *
 * The parts are elements made once: the scene re-renders every frame for the
 * camera, and a part re-rendered under a moving camera would re-measure its
 * layout mid-move and set off a layout animation of its own. */

/* ── The bench, in camera space ─────────────────────────────────────────── */

interface Spot {
  x: number
  y: number
}

type PartId = 'save' | 'tabs' | 'invite' | 'otp' | 'table' | 'timeout' | 'require'
/** The order they fly in. */
const FLIGHT: PartId[] = ['tabs', 'invite', 'otp', 'timeout', 'require', 'table', 'save']

/** The personalities, lane above lane: the first lane's controls are the parts that fly. */
const LANES: { personality?: MotionPersonality; label: string; detail: string; reduced?: boolean }[] = [
  ...(['precise', 'calm', 'lively'] as const).map((personality) => {
    const { visualDuration, bounce } = motionPersonalities[personality].springs.smooth
    return { personality, label: personality, detail: `smooth ${visualDuration.toFixed(2)}s${bounce ? ` · bounce ${bounce}` : ''}` }
  }),
  { label: 'reduced motion', detail: 'instant', reduced: true },
]
const LANE = { x: 60, y: 660, pitch: 60, switchX: 60 + 216 + 36 }
const laneY = (i: number) => LANE.y + i * LANE.pitch

/** Where each part sits on the bench (its top-left). */
const BENCH: Record<PartId, Spot> = {
  save: { x: 140, y: 180 },
  tabs: { x: 820, y: 170 },
  invite: { x: 1560, y: 176 },
  otp: { x: 1500, y: 760 },
  table: { x: 720, y: 700 },
  timeout: { x: LANE.x, y: laneY(0) },
  require: { x: LANE.switchX, y: laneY(0) + 6 },
}

/* ── The block, in camera space ─────────────────────────────────────────── */

export const BLOCK = { x: 720, y: 190, w: 560, h: 610, pad: 28 }
const BLOCK_CENTRE = { x: BLOCK.x + BLOCK.w / 2, y: BLOCK.y + BLOCK.h / 2 }
/** The block's rect on screen when it is finished (framed 1:1 and centred on the stage): the themes chapter grows its window from here. */
export const blockOnScreen = (width: number, height: number) => ({ x: width / 2 - BLOCK.w / 2, y: height / 2 - BLOCK.h / 2, w: BLOCK.w, h: BLOCK.h })

type Size = { w: number; h: number }

/** The block's rows: each control's vertical centre, in the block's own px. */
const ROWS = { otp: 172, timeout: 234, require: 288 }

/** Each part's top-left in the block, given the parts' measured sizes. */
function slots(size: Record<PartId, Size>): Record<PartId, Spot> {
  const right = (id: PartId) => BLOCK.x + BLOCK.w - BLOCK.pad - size[id].w
  const row = (y: number, id: PartId) => BLOCK.y + y - size[id].h / 2
  return {
    invite: { x: right('invite'), y: BLOCK.y + 26 },
    tabs: { x: BLOCK.x + 16, y: BLOCK.y + 76 },
    otp: { x: right('otp'), y: row(ROWS.otp, 'otp') },
    timeout: { x: right('timeout'), y: row(ROWS.timeout, 'timeout') },
    require: { x: right('require'), y: row(ROWS.require, 'require') },
    table: { x: BLOCK.x + BLOCK.pad, y: BLOCK.y + 346 },
    save: { x: right('save'), y: BLOCK.y + BLOCK.h - BLOCK.pad - size.save.h },
  }
}

/* ── The camera ─────────────────────────────────────────────────────────── */

interface Lens {
  scale: number
  x: number
  y: number
}

/** The toasts' magnification: the toast shot's own. */
const TOAST_ZOOM = 2.2

/** The lanes' framing: the controls, with room on the start side for their labels (in page space). */
const lanes = (n: number, scale: number): Lens => ({
  scale,
  x: LANE.x + (LANE.switchX + 44 - LANE.x) / 2 - 114 / scale,
  y: laneY(0) + ((n - 1) * LANE.pitch + 32) / 2,
})

/** Each shot's framing: what is at the centre of the frame, and how magnified. The square frames the same parts a little wider. */
function shotsFor(format: Pick<Format, 'square'>): [number, Lens][] {
  const fit = format.square ? 0.84 : 1
  return [
    [S.button, { scale: 3.6 * fit, x: 205, y: 200 }],
    [S.tabs, { scale: 3.3 * fit, x: 985, y: 192 }],
    [S.popover, { scale: 2.9 * fit, x: 1606, y: 286 }],
    [S.toasts, { scale: 2.2 * fit, x: 1590, y: 262 }],
    [S.otp, { scale: 2.8 * fit, x: 1652, y: 780 }],
    [S.table, { scale: 1.7 * fit, x: BENCH.table.x + TABLE_WIDTH / 2, y: 792 }],
    [S.command, { scale: 1, x: 1000, y: 540 }],
    [S.personalities, lanes(3, format.square ? 1.95 : 2.6)],
    [S.reduced, lanes(4, format.square ? 1.8 : 2.25)],
  ]
}
/** The whole bench, as the assembly begins, and the finished block. */
const WHOLE: Lens = { scale: 0.52, x: 1000, y: 540 }
const FRAMED: Lens = { scale: 1, x: BLOCK_CENTRE.x, y: BLOCK_CENTRE.y }

/**
 * From one framing to the next. A long move steps back, crosses and pushes in
 * again (the lift), so it reads as the camera travelling over the bench rather
 * than whipping across it.
 */
function between(a: Lens, b: Lens, t: number): Lens {
  const distance = Math.hypot(b.x - a.x, b.y - a.y)
  const lift = 1 - Math.min(0.55, distance / 1600) * Math.sin(Math.PI * t)
  return { scale: Math.exp(mix(Math.log(a.scale), Math.log(b.scale), t)) * lift, x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) }
}

function lensAt(frame: number, shots: [number, Lens][]): Lens {
  const assembly = frame - PARTS.duration
  if (assembly >= 0) {
    const last = shots.at(-1)![1]
    if (assembly < A.fly) return between(last, WHOLE, tween(assembly, A.pull, A.pullLength, 'emphasized'))
    return between(WHOLE, FRAMED, tween(assembly, A.fly + 20, A.expand - A.fly - 20, 'emphasized'))
  }
  let lens = shots[0]![1]
  for (let i = 1; i < shots.length; i++) {
    const [at, next] = shots[i]!
    if (frame < at) break
    lens = between(lens, next, tween(frame, at, GLIDE, 'emphasized'))
  }
  // Locked off, with the slowest push while a part plays.
  return { ...lens, scale: lens.scale * mix(1, 1.012, tween(frame, 0, PARTS.duration, 'linear')) }
}

/** Where a camera-space point is on screen, with the lens centred on (cx, cy). */
const project = (lens: Lens, p: Spot, cx: number, cy: number) => ({ x: cx + (p.x - lens.x) * lens.scale, y: cy + (p.y - lens.y) * lens.scale })

/* ── The scene ──────────────────────────────────────────────────────────── */

export function BenchScene() {
  const frame = useFrame()
  const { width, height, square } = useFormat()
  const shots = useMemo(() => shotsFor({ square }), [square])
  const lens = lensAt(frame, shots)
  const cx = width / 2
  const cy = height / 2
  const root = useRef<HTMLDivElement>(null)
  const portal = useRef<HTMLDivElement>(null)
  const [save, setSave] = useState<AsyncState>('idle')
  const [signedOut, setSignedOut] = useState(false)

  // Made once (the table again when it signs out): see the note at the top.
  const elements = useMemo(
    () => ({
      save: <SavePart onState={setSave} />,
      tabs: <TabsPart />,
      invite: <InvitePart portal={portal} />,
      otp: <CodePart />,
      timeout: <TimeoutPart personality="precise" />,
      require: <RequirePart personality="precise" />,
      lanes: <PersonalityLanes />,
      chrome: <BlockChrome />,
      grid: <BenchGrid />,
      commands: <Commands onRun={() => setSignedOut(true)} />,
    }),
    [],
  )
  const table = useMemo(() => <SessionsPart signedOut={signedOut} />, [signedOut])

  // The parts' sizes, measured once they have laid out, for their places in the block.
  const parts = useRef<Partial<Record<PartId, HTMLDivElement | null>>>({})
  const refs = useMemo(
    () => Object.fromEntries(FLIGHT.map((id) => [id, (el: HTMLDivElement | null) => void (parts.current[id] = el)])) as Record<PartId, (el: HTMLDivElement | null) => void>,
    [],
  )
  const [sizes, setSizes] = useState<Record<PartId, Size> | null>(null)
  useAction(PARTS.duration - 4, () => {
    setSizes(Object.fromEntries(FLIGHT.map((id) => [id, { w: parts.current[id]?.offsetWidth ?? 0, h: parts.current[id]?.offsetHeight ?? 0 }])) as Record<PartId, Size>)
  })
  const block = sizes ? slots(sizes) : null

  // Where each part is: on the bench, flying, or in the block.
  const assembly = frame - PARTS.duration
  const place = (id: PartId): CSSProperties => {
    const from = BENCH[id]
    const to = block?.[id] ?? from
    const p = spring(assembly, A.fly + FLIGHT.indexOf(id) * A.stagger, 'settle')
    return { left: mix(from.x, to.x, p), top: mix(from.y, to.y, p) }
  }
  const chrome = tween(assembly, A.chrome, 'deliberate', 'enter')
  const benchOnly = 1 - tween(assembly, A.pull, A.pullLength * 0.6, 'exit')
  const handOver = tween(assembly, A.expand, A.expandLength * 0.5, 'standard')
  const enter = tween(frame, 0, 'slow', 'enter')

  const find = (selector: string, dx = 0.5, dy = 0.5) => (): Point | null => {
    const el = root.current?.querySelector(selector) ?? document.querySelector(selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width * dx, y: r.top + r.height * dy }
  }
  const tab = (n: number) => find(`[data-part=tabs] [data-slot=tabs-trigger]:nth-child(${n})`)
  const sortHeader = find('[data-part=table] th:nth-child(2) button', 0.7)

  return (
    <div ref={root} className="absolute inset-0" style={{ opacity: enter * (1 - handOver) }}>
      <Camera shot={{ scale: lens.scale, x: cx - lens.x * lens.scale, y: cy - lens.y * lens.scale, originX: 0, originY: 0 }}>
        {/* Popovers grow here, inside the camera, so the lens magnifies them with their trigger. First, so it sits under the parts. */}
        <div ref={portal} className="absolute inset-0" />
        {elements.grid}
        <Fade show={chrome}>{elements.chrome}</Fade>
        <Fade show={benchOnly}>{elements.lanes}</Fade>
        {FLIGHT.map((id) => (
          <div key={id} ref={refs[id]} data-part={id} className="absolute" style={place(id)}>
            {id === 'table' ? table : elements[id]}
          </div>
        ))}
      </Camera>

      <LaneLabels frame={frame} lens={lens} width={width} height={height} />
      <Toasts frame={frame} />
      {elements.commands}
      <Keycaps frame={frame} />
      <Labels frame={frame} save={save} />
      <Cursor
        start={{ x: 1040, y: 900 }}
        size={() => lens.scale * 0.85}
        show={[
          [BUTTON_BEATS.reach - 6, S.otp + 10],
          [TABLE_BEATS.reach - 6, TABLE_BEATS.away + 30],
        ]}
        moves={[
          { at: BUTTON_BEATS.reach, to: find('[data-part=save] button', 0.62), frames: BUTTON_BEATS.frames, press: 'click' },
          { at: BUTTON_BEATS.resolve + 12, to: { x: 980, y: 680 }, frames: 30 },
          { at: TABS_BEATS.reach, to: tab(1), frames: 26 },
          { at: TABS_BEATS.sweep, to: tab(4), frames: TABS_BEATS.sweepFrames, sweep: true },
          { at: TABS_BEATS.click, to: tab(2), frames: TABS_BEATS.clickFrames, press: 'click' },
          { at: POPOVER_BEATS.reach, to: find('[data-part=invite] [data-part=invite-trigger]', 0.6), frames: POPOVER_BEATS.frames, press: 'click' },
          { at: POPOVER_BEATS.send, to: find('[data-part=invite-send]', 0.6), frames: POPOVER_BEATS.sendFrames, press: 'click' },
          { at: TOAST_BEATS.hover, to: find('[data-slot=toast]', 0.62, 0.55), frames: TOAST_BEATS.hoverFrames },
          { at: TOAST_BEATS.away, to: { x: 520, y: 690 }, frames: 26 },
          { at: TABLE_BEATS.reach, to: sortHeader, frames: TABLE_BEATS.frames, press: 'click' },
          { at: TABLE_BEATS.again, to: sortHeader, frames: 8, press: 'click' },
          { at: TABLE_BEATS.away, to: { x: 1180, y: 720 }, frames: 30 },
        ]}
      />
    </div>
  )
}

/** Fades what it holds without re-rendering it. */
function Fade({ show, children }: { show: number; children: ReactNode }) {
  if (show <= 0) return null
  return <div style={{ opacity: show }}>{children}</div>
}

/** The bench's surface: a fine grid that moves with the camera, so every glide reads as the camera travelling. */
const BenchGrid = memo(function BenchGrid() {
  return (
    <div
      aria-hidden
      className="absolute"
      style={{
        left: -700,
        top: -400,
        width: 3600,
        height: 1800,
        backgroundImage:
          'linear-gradient(color-mix(in oklab, var(--color-line) 42%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--color-line) 42%, transparent) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        backgroundPosition: '700px 400px',
        maskImage: 'radial-gradient(ellipse 58% 62% at 50% 50%, black 35%, transparent 90%)',
      }}
    />
  )
})

/* ── The personalities ─────────────────────────────────────────────────── */

/** The timeout control and the 2FA switch in each personality, lane above lane; the first lane's own are the parts that fly. */
function PersonalityLanes() {
  return (
    <>
      {LANES.map((lane, i) => {
        if (i === 0) return null
        const controls = (
          <>
            <div className="absolute" style={{ left: LANE.x, top: laneY(i) }}>
              <TimeoutPart personality={lane.personality} />
            </div>
            <div className="absolute" style={{ left: LANE.switchX, top: laneY(i) + 6 }}>
              <RequirePart personality={lane.personality} />
            </div>
          </>
        )
        return lane.reduced ? (
          <Joins key={lane.label}>
            <YoujProvider reducedMotion="always">{controls}</YoujProvider>
          </Joins>
        ) : (
          <div key={lane.label}>{controls}</div>
        )
      })}
    </>
  )
}

/** When reduced motion joins the lanes: a calm crossfade. */
const joined = (frame: number) => tween(frame, S.reduced, 'deliberate', 'standard')

function Joins({ children }: { children: ReactNode }) {
  const show = useFrameValue((f) => Math.round(joined(f) * 40) / 40)
  return <div style={{ opacity: show }}>{children}</div>
}

/** Each lane's name and the spring its indicator glides on, beside the lane, in page space so it reads at one size. */
function LaneLabels({ frame, lens, width, height }: { frame: number; lens: Lens; width: number; height: number }) {
  const shown = during(frame, S.personalities + GLIDE * 0.6, PARTS.duration + 8, 16)
  if (shown <= 0) return null
  return (
    <>
      {LANES.map((lane, i) => {
        const at = project(lens, { x: LANE.x, y: laneY(i) + 16 }, width / 2, height / 2)
        const show = shown * (lane.reduced ? joined(frame) : 1)
        if (show <= 0) return null
        return (
          <div
            key={lane.label}
            className="absolute flex flex-col items-end gap-1.5 font-mono leading-none whitespace-nowrap"
            style={{ right: width - at.x + 26, top: at.y - 15, opacity: show }}
          >
            <span className="flex items-center gap-2 text-[14px] tracking-[0.12em] text-fg-muted uppercase">
              <span aria-hidden className="size-1.5 rounded-[1px] bg-accent" />
              {lane.label}
            </span>
            <span className="text-[12.5px] tracking-[0.02em] text-fg-subtle">{lane.detail}</span>
          </div>
        )
      })}
    </>
  )
}

/* ── The block's chrome ────────────────────────────────────────────────── */

/** Everything in the Security block that isn't one of the parts: the surface, the words and the rules. */
const BlockChrome = memo(function BlockChrome() {
  const rows = [
    { y: ROWS.otp, label: 'Two-factor code', detail: 'From your authenticator app.' },
    { y: ROWS.timeout, label: 'Session timeout', detail: 'Sign out after this long idle.' },
    { y: ROWS.require, label: 'Require 2FA', detail: 'For everyone, at next sign-in.' },
  ]
  return (
    <div className="absolute" style={{ left: BLOCK.x, top: BLOCK.y, width: BLOCK.w, height: BLOCK.h }}>
      <div className="absolute inset-0 rounded-xl border border-line bg-surface shadow-lg" />
      <div className="absolute flex flex-col gap-1" style={{ left: BLOCK.pad, top: 26 }}>
        <h3 className="text-[17px] leading-tight font-semibold tracking-[-0.01em] text-fg">Security</h3>
        <p className="text-ui text-fg-muted">Sign-in and sessions for Northwind.</p>
      </div>
      <span aria-hidden className="absolute inset-x-0 h-px bg-line" style={{ top: 116 }} />
      {rows.map((row, i) => (
        <div key={row.label}>
          <div className="absolute flex flex-col gap-0.5" style={{ left: BLOCK.pad, top: row.y - 19 }}>
            <span className="text-ui font-medium text-fg">{row.label}</span>
            <span className="text-ui-sm text-fg-muted">{row.detail}</span>
          </div>
          {i < rows.length - 1 && <span aria-hidden className="absolute h-px bg-line" style={{ left: BLOCK.pad, right: BLOCK.pad, top: (row.y + rows[i + 1]!.y) / 2 }} />}
        </div>
      ))}
      <p className="absolute text-ui font-medium text-fg" style={{ left: BLOCK.pad, top: 322 }}>
        Active sessions
      </p>
      <div className="absolute flex" style={{ right: BLOCK.pad + 142, bottom: BLOCK.pad }}>
        <Button variant="ghost" size="lg" tabIndex={-1}>
          Cancel
        </Button>
      </div>
    </div>
  )
})

/* ── Overlays in page space ────────────────────────────────────────────── */

/**
 * The toasts: the film's Toaster, parked in the bottom-end corner and zoomed
 * to the lens while this shot is up, fed by the app (Invite's send) and by
 * two more notifications; the pointer spreads the stack, then they go.
 */
function Toasts({ frame }: { frame: number }) {
  const zoom = frame >= POPOVER_BEATS.send && frame < S.otp ? TOAST_ZOOM : 1
  useLayoutEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--film-toast-zoom', String(zoom))
    root.setProperty('--film-toast-bottom', `${60 / zoom}px`)
    root.setProperty('--film-toast-end', `${72 / zoom}px`)
  }, [zoom])
  useAction(TOAST_BEATS.second, () => toast('Session signed out', { description: 'Pixel 7 · Tokyo' }))
  useAction(TOAST_BEATS.third, () => toast.info('Backup codes ready', { description: 'Store them somewhere safe.' }))
  useAction(TOAST_BEATS.dismiss, () => toast.dismiss())
  return null
}

/** ⌘K, pressed: the keycaps the palette answers to, drawn big where the palette is about to open. */
function Keycaps({ frame }: { frame: number }) {
  const b = COMMAND_BEATS
  const show = during(frame, b.keys, b.press + 20, 12)
  if (show <= 0) return null
  const down = during(frame, b.press - 2, b.press + 8, 3)
  const cap = { boxShadow: down > 0.5 ? 'none' : undefined }
  return (
    <div className="absolute inset-x-0 flex justify-center" style={{ top: 200, opacity: show }}>
      <div style={{ zoom: 3, transform: `translateY(${down * 1.5}px)` }}>
        <KbdGroup>
          <Kbd style={cap}>⌘</Kbd>
          <Kbd style={cap}>K</Kbd>
        </KbdGroup>
      </div>
    </div>
  )
}

/** One label per shot, bottom-start: the component, then what moves (for Save, the state it is in). */
function Labels({ frame, save }: { frame: number; save: AsyncState }) {
  const window = (from: number, to: number) => during(frame, from + GLIDE * 0.6, to + 6, 14)
  const labels: [number, number, string, string][] = [
    [S.button - GLIDE, S.tabs, 'Button · onAction', save],
    [S.tabs, S.popover, 'Tabs', 'hover follows, underline glides'],
    [S.popover, S.toasts, 'Popover', 'grows from its trigger'],
    [S.toasts, S.otp, 'Toast', 'the older step back'],
    [S.otp, S.table, 'InputOTP', 'the focus frame glides'],
    [S.table, S.command, 'DataTable', 'rows glide to their slots'],
    [S.command, S.personalities, 'Command · ⌘K', 'the row glides, the list eases'],
    [S.personalities, PARTS.duration, 'Motion personalities', 'one contract, three tunings'],
  ]
  return (
    <>
      {labels.map(([from, to, name, detail]) => (
        <ShotLabel key={name} name={name} detail={detail} show={window(from, to)} />
      ))}
      <ShotLabel name="Composition" detail="made of the same parts" show={during(frame, PARTS.duration + A.fly, PARTS.duration + A.expand, 18)} />
    </>
  )
}
