import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { type SoundCue } from '@youj/core'
import { SoundCueContext } from '@youj/core/internal'
import { Button } from '@youj/react/components/ui/button'
import { AsyncButton } from '@youj/react/components/ui/async-button'
import { SegmentedControl, SegmentedControlItem } from '@youj/react/components/ui/segmented-control'
import { Switch } from '@youj/react/components/ui/switch'
import { toast, Toaster } from '@youj/react/components/ui/toast'
import { mix, tween } from '../lib/timing'
import { virtual } from '../sim/clock'
import { useAction, useFrame } from '../sim/simulation'
import { Backdrop } from '../film/backdrop'
import { Camera } from '../film/camera'
import { FPS } from '../film/beats'
import { useFormat, type Format } from '../film/format'
import { pressAt, releaseAt } from '../film/user'
import { SOUND_LOOP as S, TOPICS, type SoundLane, type SoundNote } from './beats'
import { CUE_BINS, GLASS } from './sound-cues'

/* Sound, as a loop (beats.ts has the story). Five real components stand one
 * above the other at the playhead, each over its own strip of tape, and the
 * score runs through them right to left. Each note is a cue's waveform from
 * the Glass pack, exactly as the SoundProvider plays it (sound-cues.ts is
 * decoded from the pack's own files): the highest and lowest sample in each
 * sliver of time, on one amplitude scale for every cue, and on a true time
 * axis, so a press is a spike and an outcome rings on. As a note reaches the
 * playhead its component plays it, the way someone would (a press, a click,
 * a promise settling, a toast arriving), and the component's own cue is what
 * sounds: the scene listens on the cue bus, and a render stops at any note
 * its part didn't emit on its frame. The note lights in the accent as it
 * passes and settles back into the score behind.
 *
 * The tape is drawn by layout, in the frame's own pixels, so its hairlines
 * stay one pixel at any magnification; the components are at their real
 * size under a Camera, so their own layout animations measure through the
 * lens. The toast portals to the page, so it is placed and zoomed to match. */

const P = TOPICS.sound.preroll
const PERIOD = TOPICS.sound.frames / FPS
/** Tape speed, stage px a second at 1:1. */
const SPEED = 240
/** Full scale, in stage px either side of the tape at 1:1. */
const AMP = 84
/** Tape to tape, and from a tape up to the bottom of its component. */
const PITCH = 128
const RISE = 40
/** How long a note stays lit once it has sounded, in seconds: its glow drains back into the score. */
const GLOW = 1.1
/** The toast's height at 1:1: it portals to the page, so its lane keeps its place for it. */
const TOAST = 52

const LANES = S.lanes
const tapeOf = (lane: SoundLane) => (LANES.indexOf(lane) - (LANES.length - 1) / 2) * PITCH
/** What the camera centres on for a part: between the component and its tape. */
const focusOf = (lane: SoundLane) => tapeOf(lane) - 26

/**
 * The close-up, and the pull back to all five, in px on screen per stage px:
 * pulled back, the lanes fill about two thirds of the frame's height, the
 * parts still read, and the waves stay big enough to tell apart (on the
 * strip, as much of the column as its height holds).
 */
function scalesOf(format: Format) {
  // On the strip the close-up is tight enough that the next part down waits wholly out of frame, not cut by its edge.
  if (format.tile) return { macro: 2.45, wide: 0.64 }
  if (format.tall) return { macro: 2.7, wide: 1.3 }
  return { macro: 3.2, wide: 1.12 }
}

/** The camera: its magnification, and the stage y it centres (the playhead is always the frame's middle). */
interface Lens {
  g: number
  y: number
}

/** Zooms move in log scale, so a pull back reads at an even rate. */
const between = (a: Lens, b: Lens, t: number): Lens => ({ g: Math.exp(mix(Math.log(a.g), Math.log(b.g), t)), y: mix(a.y, b.y, t) })

/** Down the parts at macro, a note each; out to all five; back in to Send. */
function lensAt(frame: number, format: Format): Lens {
  const { macro, wide } = scalesOf(format)
  const close = (lane: SoundLane): Lens => ({ g: macro, y: focusOf(lane) })
  const all: Lens = { g: wide, y: focusOf(LANES[2]!) }
  let lens = close(LANES[0]!)
  S.steps.forEach((at, i) => (lens = between(lens, close(LANES[i + 1]!), tween(frame, P + at, S.step, 'emphasized'))))
  lens = between(lens, all, tween(frame, P + S.pull, S.pullLength, 'emphasized'))
  return between(lens, close(LANES[0]!), tween(frame, P + S.push, S.pushLength, 'emphasized'))
}

/* ── The notes ─────────────────────────────────────────────────────────── */

type Wave = { max: number[]; min: number[] }
const waveOf = (note: SoundNote): Wave => GLASS[note.cue]
const lengthOf = (wave: Wave) => wave.max.length / CUE_BINS

/** The loudest the wave gets in a stretch of it, [from, to) seconds in, both ways, as fractions of full scale. */
function extent(wave: Wave, from: number, to: number) {
  const a = Math.max(0, Math.floor(from * CUE_BINS))
  const b = Math.min(wave.max.length, Math.max(a + 1, Math.ceil(to * CUE_BINS)))
  let hi = 0
  let lo = 0
  for (let i = a; i < b; i++) {
    hi = Math.max(hi, wave.max[i]!)
    lo = Math.min(lo, wave.min[i]!)
  }
  return { hi: hi / 1000, lo: lo / 1000 }
}

/* ── The scene ─────────────────────────────────────────────────────────── */

export function SoundLoop() {
  const frame = useFrame()
  const format = useFormat()
  const { width, height } = format
  const lens = lensAt(frame, format)
  const cx = width / 2
  const cy = height / 2
  const now = (frame - P) / FPS
  /** Screen y of a stage y. */
  const sy = (y: number) => cy + (y - lens.y) * lens.g
  /** Screen x of a moment on the tape: the playhead is the frame's middle. */
  const sx = (t: number) => cx + (t - now) * SPEED * lens.g
  const root = useRef<HTMLDivElement>(null)

  /* The cue bus: what the components themselves emitted, and when. */
  const heard = useRef<{ cue: SoundCue; frame: number }[]>([])
  const at = useRef(frame)
  at.current = frame
  const sink = useCallback((cue: SoundCue) => void heard.current.push({ cue, frame: at.current }), [])
  // A render stops rather than show a note its part didn't emit on its frame (the Studio's real-time preview only approximates frames).
  const unheard = S.score.filter((n) => frame > P + n.at && !heard.current.some((h) => h.cue === n.cue && h.frame === P + n.at - 1))
  if (virtual && unheard.length) throw new Error(`The sound loop's parts didn't play their notes: ${unheard.map((n) => `${n.lane} ${n.cue} at ${n.at}`).join(', ')}`)
  const light = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light'

  /* The parts, made once: the camera moves them, never re-renders them. Publish's work settles when the director says. */
  const settle = useRef<{ resolve: () => void; reject: (reason: Error) => void } | null>(null)
  const parts = useMemo<Record<Exclude<SoundLane, 'toast'>, ReactNode>>(
    () => ({
      send: (
        <Button tabIndex={-1} className="min-w-20">
          Send
        </Button>
      ),
      switch: <Switch tabIndex={-1} aria-label="Notifications" />,
      range: (
        <SegmentedControl defaultValue="day" aria-label="Range">
          {['Day', 'Week', 'Month'].map((label) => (
            <SegmentedControlItem key={label} value={label.toLowerCase()} data-value={label.toLowerCase()} tabIndex={-1}>
              {label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      ),
      publish: (
        <AsyncButton
          variant="secondary"
          tabIndex={-1}
          onAction={() => new Promise<void>((resolve, reject) => (settle.current = { resolve, reject }))}
          pendingLabel="Publishing…"
          successLabel="Published"
          errorLabel="Failed"
        >
          Publish
        </AsyncButton>
      ),
    }),
    [],
  )

  // How tall each part stands over its tape, at 1:1, so the playhead passes behind it rather than through a part's translucent track.
  const [heights, setHeights] = useState<Record<SoundLane, number> | null>(null)
  useLayoutEffect(() => {
    const of = (lane: SoundLane) => root.current?.querySelector<HTMLElement>(`[data-lane=${lane}] > *`)?.offsetHeight ?? 0
    setHeights({ send: of('send'), switch: of('switch'), range: of('range'), publish: of('publish'), toast: TOAST })
  }, [])

  return (
    <SoundCueContext.Provider value={sink}>
      <div ref={root} className="absolute inset-0">
        {/* The glow behind the playhead is lower in light, so it doesn't haze the white. */}
        <Backdrop grid={0} glow={light ? 0.22 : 0.3} glowAt={{ x: 50, y: 50 }} />
        <Tape lens={lens} width={width} height={height} now={now} sx={sx} sy={sy} heights={heights} />
        <Camera shot={{ scale: lens.g, x: cx, y: cy - lens.y * lens.g, originX: 0, originY: 0 }}>
          {(Object.keys(parts) as (keyof typeof parts)[]).map((lane) => (
            <div key={lane} data-lane={lane} className="absolute flex items-end justify-center" style={{ left: -240, width: 480, top: tapeOf(lane) - RISE - 120, height: 120 }}>
              {parts[lane]}
            </div>
          ))}
        </Camera>
        <ToastPart lens={lens} height={height} cy={cy} />
        {S.score.map((note) => (
          <Play key={`${note.lane}-${note.at}`} note={note} root={root} settle={settle} />
        ))}
      </div>
    </SoundCueContext.Provider>
  )
}

type Settle = { current: { resolve: () => void; reject: (reason: Error) => void } | null }

/** What a note's hand presses: the part's control (for a choice, the segment it picks, alternating away and back). */
function targetOf(note: SoundNote) {
  if (note.lane === 'switch') return '[data-lane=switch] [role=switch]'
  if (note.lane === 'range') return `[data-lane=range] [data-value=${S.score.filter((n) => n.lane === 'range' && n.at <= note.at).length % 2 === 1 ? 'week' : 'day'}]`
  return `[data-lane=${note.lane}] button`
}

/**
 * The director's hand for one note: what someone does to its part so that
 * the part sounds at `note.at`. Its cue is emitted once the frame before has
 * rendered, so the change and the sound both start on the note's own frame.
 * A button sounds as it goes down; a switch and a segment on the click, so
 * those are pressed a moment before. Nothing is left focused or hovered.
 */
function Play({ note, root, settle }: { note: SoundNote; root: { current: HTMLDivElement | null }; settle: Settle }) {
  const at = P + note.at
  const clicks = note.cue === 'toggleOn' || note.cue === 'toggleOff' || note.cue === 'select'
  const presses = clicks || note.cue === 'tap'
  const [down, up] = clicks ? [at - 6, at - 1] : [at - 1, at + 4]
  const pressed = useRef<Element | null>(null)
  const centre = () => {
    const r = root.current?.querySelector(targetOf(note))?.getBoundingClientRect()
    return r ? ([r.left + r.width / 2, r.top + r.height / 2] as const) : ([-1, -1] as const)
  }
  useAction(presses ? down : -1, () => (pressed.current = pressAt(...centre())))
  useAction(presses ? up : -1, () => releaseAt(...centre(), pressed.current))
  useAction(presses ? up + 1 : -1, () => (document.activeElement as HTMLElement | null)?.blur?.())
  useAction(note.cue === 'success' ? at - 1 : -1, () => settle.current?.resolve())
  useAction(note.cue === 'error' ? at - 1 : -1, () => settle.current?.reject(new Error('Publishing failed')))
  useAction(note.cue === 'notify' ? at - 1 : -1, () => toast('Mira replied'))
  return null
}

/** The toast's part: the loop's own Toaster, sat over its tape at the playhead and zoomed to the lens. Dismissed silently. */
function ToastPart({ lens, height, cy }: { lens: Lens; height: number; cy: number }) {
  const bottom = cy + (tapeOf('toast') - RISE - lens.y) * lens.g
  useLayoutEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--sound-toast-zoom', String(lens.g))
    root.setProperty('--sound-toast-bottom', `${(height - bottom) / lens.g}px`)
  })
  useAction(P + S.dismiss, () => toast.dismiss())
  return <Toaster position="bottom-center" limit={1} timeout={60_000} className="bottom-(--sound-toast-bottom) w-[15rem] [zoom:var(--sound-toast-zoom)]" />
}

/* ── The tape ──────────────────────────────────────────────────────────── */

const GHOST = 'color-mix(in oklab, var(--color-fg) 20%, transparent)'
const PAST = 'color-mix(in oklab, var(--color-fg) 44%, transparent)'
const EMBER = 'color-mix(in oklab, var(--color-accent) 45%, color-mix(in oklab, var(--color-fg) 44%, transparent))'

/**
 * The tapes, the beats and the notes, in screen space. Every note is one
 * path and one fill: a gradient pinned to the playhead lights whatever has
 * just sounded in the accent, lets it drain back to the score's grey over
 * GLOW, and leaves what hasn't sounded yet faint.
 */
function Tape({
  lens,
  width,
  height,
  now,
  sx,
  sy,
  heights,
}: {
  lens: Lens
  width: number
  height: number
  now: number
  sx: (t: number) => number
  sy: (y: number) => number
  heights: Record<SoundLane, number> | null
}) {
  const g = lens.g
  const head = width / 2
  const pps = SPEED * g
  // The rules are one device pixel, on the pixel grid, so they stay crisp at every cut's scale.
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio
  const hair = 1 / dpr
  const crisp = (v: number) => (Math.round(v * dpr - 0.5) + 0.5) / dpr
  const from = now - head / pps
  const to = now + head / pps
  const top = sy(tapeOf(LANES[0]!) - RISE - 64)
  const bottom = sy(tapeOf(LANES.at(-1)!) + AMP * 0.6)

  // The beat grid: a line a beat, stronger on the bar.
  const beat = S.beat / FPS
  const beats: { b: number; x: number; bar: boolean }[] = []
  for (let b = Math.ceil(from / beat); b * beat <= to; b++) beats.push({ b, x: sx(b * beat), bar: b % 4 === 0 })

  // Each note, wherever the tape has it in frame: this loop's, and the loops' either side.
  const notes: { note: SoundNote; t: number }[] = []
  for (const note of S.score) {
    for (let k = -1; k <= 1; k++) {
      const t = note.at / FPS + k * PERIOD
      if (t + lengthOf(waveOf(note)) >= from && t <= to) notes.push({ note, t })
    }
  }

  const path = ({ note, t }: { note: SoundNote; t: number }) => {
    const wave = waveOf(note)
    const x0 = sx(t)
    const x1 = sx(t + lengthOf(wave))
    const y = sy(tapeOf(note.lane))
    const upper: string[] = []
    const lower: string[] = []
    for (let x = Math.max(Math.floor(x0), 0); x <= Math.min(Math.ceil(x1), width); x++) {
      const { hi, lo } = extent(wave, (x - x0) / pps, (x + 1 - x0) / pps)
      upper.push(`${x} ${(y - hi * AMP * g).toFixed(2)}`)
      lower.push(`${x} ${(y - lo * AMP * g).toFixed(2)}`)
    }
    return upper.length ? `M${upper.join('L')}L${lower.reverse().join('L')}Z` : ''
  }

  /** The playhead from top to bottom, passing behind each part: broken where a part stands, a few px clear of it. */
  const playhead = (x: number, from: number, to: number, stand: Record<SoundLane, number>) => {
    const clear = 6 * g
    let d = ''
    let y = from
    for (const lane of LANES) {
      const base = sy(tapeOf(lane) - RISE)
      const gapTop = base - stand[lane] * g - clear
      if (gapTop > y) d += `M${x} ${y.toFixed(2)}V${gapTop.toFixed(2)}`
      y = Math.max(y, base + clear)
    }
    return `${d}M${x} ${y.toFixed(2)}V${to.toFixed(2)}`
  }

  // How loud each part is at the playhead right now (the peak over the last frame), for its glow.
  const level = (lane: SoundLane) => {
    let peak = 0
    for (const { note, t } of notes) {
      if (note.lane !== lane || now < t) continue
      const { hi, lo } = extent(waveOf(note), now - t - 1 / FPS, now - t)
      peak = Math.max(peak, hi, -lo)
    }
    return peak
  }

  return (
    <svg
      aria-hidden
      className="absolute inset-0"
      width={width}
      height={height}
      fill="none"
      style={{ maskImage: 'linear-gradient(90deg, transparent, black 14%, black 86%, transparent)' }}
    >
      <defs>
        <linearGradient id="sound-lit" gradientUnits="userSpaceOnUse" x1={head - GLOW * pps} y1={0} x2={head + 0.5} y2={0}>
          <stop offset={0} style={{ stopColor: PAST }} />
          <stop offset={0.62} style={{ stopColor: EMBER }} />
          <stop offset={0.999} style={{ stopColor: 'var(--color-accent)' }} />
          <stop offset={1} style={{ stopColor: GHOST }} />
        </linearGradient>
        <linearGradient id="sound-rule" gradientUnits="userSpaceOnUse" x1={0} y1={top} x2={0} y2={bottom}>
          <stop offset={0} style={{ stopColor: 'var(--color-fg)', stopOpacity: 0 }} />
          <stop offset={0.18} style={{ stopColor: 'var(--color-fg)', stopOpacity: 1 }} />
          <stop offset={0.9} style={{ stopColor: 'var(--color-fg)', stopOpacity: 1 }} />
          <stop offset={1} style={{ stopColor: 'var(--color-fg)', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      {beats.map(({ b, x, bar }) => (
        <line key={b} x1={x} x2={x} y1={top} y2={bottom} stroke="url(#sound-rule)" strokeOpacity={bar ? 0.16 : 0.075} strokeWidth={1} />
      ))}
      {LANES.map((lane) => (
        <line key={lane} x1={0} x2={width} y1={crisp(sy(tapeOf(lane)))} y2={crisp(sy(tapeOf(lane)))} stroke="color-mix(in oklab, var(--color-fg) 22%, transparent)" strokeWidth={hair} />
      ))}
      {heights && <path d={playhead(crisp(head), top, bottom, heights)} stroke="url(#sound-rule)" strokeOpacity={0.55} strokeWidth={hair} />}
      {LANES.map((lane) => {
        const peak = level(lane)
        // A glint at the playhead while the part sounds, as bright as the sound is loud; it grows gently with the lens, so it stays a glint at macro.
        const k = Math.sqrt(g)
        return peak > 0.002 ? (
          <ellipse key={lane} cx={head} cy={sy(tapeOf(lane))} rx={6 * k} ry={(3 + peak * AMP * 0.8) * k} fill="var(--color-accent)" opacity={Math.min(0.3, peak * 0.8)} style={{ filter: `blur(${5 * k}px)` }} />
        ) : null
      })}
      {notes.map((n) => (
        <path key={`${n.note.lane}-${n.t}`} d={path(n)} fill="url(#sound-lit)" />
      ))}
    </svg>
  )
}
