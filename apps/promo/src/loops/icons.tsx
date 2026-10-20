import { useMemo, type CSSProperties } from 'react'
import {
  BatteryChargingIcon,
  BellIcon,
  CheckIcon,
  icons,
  MenuIcon,
  PlayIcon,
  TargetIcon,
  type YoujIconComponent,
} from '@youj/icons'
import { mix, tween } from '../lib/timing'
import { useFrame, useFrameValue } from '../sim/simulation'
import { Backdrop } from '../film/backdrop'
import { useFormat, type Format } from '../film/format'
import { Keylines } from '../film/keylines'
import { ICONS_LOOP as B, TOPICS } from './beats'

/* Icons, as a loop. The set is laid out once, every icon on its own drawing
 * board, and a chain of six sits side by side in the middle row: menu, play,
 * bell, check and two of the newest (battery charging, a target). At macro
 * the camera steps along the chain and each icon plays as it arrives, the
 * state icons flipping (menu to close, play to pause) and holding there.
 * From the last board it pulls back until the set fills the frame, while a
 * ripple spreads out from where it left, flipping everything it passes (the
 * held states flip home); then it pushes back in to the first board as a
 * second wave gathers toward it, and lands on the menu at rest: the frame
 * the loop starts on.
 *
 * Like the film's icons chapter, the lens is applied by layout: every cell
 * is placed and drawn at its size on screen, so a 22× close-up lands on
 * whole pixels and the pull-back never shimmers. */

const P = TOPICS.icons.preroll
const CHAIN: YoujIconComponent[] = [MenuIcon, PlayIcon, BellIcon, CheckIcon, BatteryChargingIcon, TargetIcon]
/** An icon's size in the set, and the gap between neighbours' centres, in stage px at 1:1. */
const ICON = 20
const PITCH = 46
/** How long a wave keeps an icon playing: long enough for a state to flip there and back. */
const PULSE = 44

/* ── The set ───────────────────────────────────────────────────────────── */

interface Field {
  cols: number
  rows: number
  /** Stage px of the top-start cell's centre. */
  origin: { x: number; y: number }
  /** Where the chain starts: its first cell. */
  chain: { row: number; col: number }
  cells: YoujIconComponent[]
}

/** Every icon once, in a stable, well-mixed order, with the chain side by side in the middle row. */
function fieldFor(format: Format): Field {
  const cols = format.tall ? 18 : 27
  const others = icons.filter((icon) => !CHAIN.includes(icon)).map((icon, i, all) => ({ icon, key: (i * 7919) % all.length }))
  const rest = others.sort((a, b) => a.key - b.key).map(({ icon }) => icon)
  const rows = Math.ceil((rest.length + CHAIN.length) / cols)
  const chain = { row: Math.floor((rows - 1) / 2), col: Math.floor((cols - CHAIN.length) / 2) }
  const at = chain.row * cols + chain.col
  const cells = [...rest.slice(0, at), ...CHAIN, ...rest.slice(at)]
  const origin = { x: format.width / 2 - ((cols - 1) * PITCH) / 2, y: format.height / 2 - ((rows - 1) * PITCH) / 2 }
  return { cols, rows, origin, chain, cells }
}

const centre = (field: Field, row: number, col: number) => ({ x: field.origin.x + col * PITCH, y: field.origin.y + row * PITCH })

/* ── The lens: a stage point shown at the frame's centre, at a scale ──── */

interface Lens {
  scale: number
  x: number
  y: number
}

/** Zooms move in log scale, so a pull-back reads at an even rate. */
function between(a: Lens, b: Lens, t: number): Lens {
  return { scale: Math.exp(mix(Math.log(a.scale), Math.log(b.scale), t)), x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) }
}

/** The board's size on screen at macro, per stage: about half the frame's height (on the strip, most of it), and big enough that the next board waits wholly off frame. */
function macroSize(format: Format) {
  if (format.tile) return 320
  if (format.tall) return 400
  return 440
}

/** The pulled-back framing: the set fills the frame (on the strip, a close crop of it, so the icons still read in a tile). */
function wholeScale(format: Format, field: Field) {
  if (format.tile) return 1.9
  const width = (field.cols - 1) * PITCH + ICON * 2
  const height = (field.rows - 1) * PITCH + ICON * 2
  return Math.max(format.width / width, format.height / height)
}

export function IconsLoop() {
  const frame = useFrame()
  const format = useFormat()
  const { width, height } = format
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  const field = useMemo(() => fieldFor(format), [format.width, format.height])
  const cx = width / 2
  const cy = height / 2
  const link = (i: number) => centre(field, field.chain.row, field.chain.col + i)
  const macro = (i: number): Lens => ({ scale: macroSize(format) / ICON, ...link(i) })
  const whole: Lens = { scale: wholeScale(format, field), x: cx, y: cy }

  // Along the chain, one board at a time; out to the set; back in to the first.
  let lens = macro(0)
  B.steps.forEach((at, i) => (lens = between(lens, macro(i + 1), tween(frame, P + at, B.step, 'emphasized'))))
  lens = between(lens, whole, tween(frame, P + B.pull, B.pullLength, 'emphasized'))
  lens = between(lens, macro(0), tween(frame, P + B.push, B.pushLength, 'emphasized'))

  const project = (p: { x: number; y: number }) => ({ x: cx + (p.x - lens.x) * lens.scale, y: cy + (p.y - lens.y) * lens.scale })
  const size = ICON * lens.scale
  /** A cell's box on screen, or null when it is out of frame. */
  const cellBox = (row: number, col: number): CSSProperties | null => {
    const c = project(centre(field, row, col))
    if (c.x + size < -20 || c.x - size > width + 20 || c.y + size < -20 || c.y - size > height + 20) return null
    return { left: c.x - size / 2, top: c.y - size / 2, width: size, height: size }
  }

  // The boards belong to the close-ups: they go as the camera pulls back and return as it pushes in.
  const keylines = 1 - tween(frame, P + B.pull + 4, 40, 'exit') + tween(frame, P + B.push + 56, 44, 'enter')
  // The rest of the set is there only while the camera is out among it.
  const crowd = tween(frame, P + B.pull, B.pullLength * 0.5, 'standard') * (1 - tween(frame, P + B.push + B.pushLength * 0.45, B.pushLength * 0.4, 'standard'))

  const last = field.chain.col + CHAIN.length - 1
  const first = field.chain.col
  const waves = useMemo(
    () => ({
      // Out from the last board, as the camera leaves it.
      out: (row: number, col: number) => P + B.ripple + Math.hypot(row - field.chain.row, col - last) * 3.2,
      // In toward the first board from the edges; it stops short of the board and its neighbours, which the camera lands on.
      in: (row: number, col: number) => {
        const d = Math.hypot(row - field.chain.row, col - first)
        return d < 2.5 ? Infinity : P + B.gather + (18 - Math.min(18, d)) * 2.8
      },
    }),
    [field, first, last],
  )

  return (
    <div className="absolute inset-0">
      <Backdrop grid={0.7} glow={0.3} glowAt={{ x: 50, y: 50 }} />
      <div className="absolute inset-0" style={{ maskImage: 'radial-gradient(ellipse 78% 82% at 50% 50%, black 58%, transparent 100%)' }}>
        {CHAIN.map((_, i) => (
          <Board key={i} box={cellBox(field.chain.row, first + i)} size={size} show={keylines} />
        ))}
        {field.cells.map((Icon, i) => {
          const row = Math.floor(i / field.cols)
          const col = i % field.cols
          const link = row === field.chain.row && col >= first && col <= last ? col - first : -1
          return <Cell key={Icon.meta.name} Icon={Icon} box={cellBox(row, col)} size={size} link={link} crowd={crowd} out={waves.out(row, col)} into={waves.in(row, col)} />
        })}
      </div>
    </div>
  )
}

/** A cell's drawing board: the 24 grid, one screen pixel thick at any size. */
function Board({ box, size, show }: { box: CSSProperties | null; size: number; show: number }) {
  if (show <= 0 || !box) return null
  return (
    <div className="absolute" style={{ ...box, opacity: Math.min(1, show) }}>
      <Keylines size={size} hairline={24 / size} grid={0.55} />
    </div>
  )
}

/**
 * One icon of the set. A link in the chain plays when the camera reaches it
 * and holds its state until the ripple passes; every icon plays for a pulse
 * as each wave passes, its front lit in the accent.
 */
function Cell({
  Icon,
  box,
  size,
  link,
  crowd,
  out,
  into,
}: {
  Icon: YoujIconComponent
  box: CSSProperties | null
  size: number
  /** Its place in the chain, or -1. */
  link: number
  crowd: number
  out: number
  into: number
}) {
  const plays = link >= 0 ? P + B.plays[link]! : Infinity
  const active = useFrameValue((f) => (f >= plays && f < out) || (f >= out && f < out + PULSE) || (f >= into && f < into + PULSE))
  const front = useFrameValue((f) => Math.round(Math.max(0, 1 - Math.abs(f - out - 6) / 12, 1 - Math.abs(f - into - 6) / 12) * 20) / 20)
  if (!box) return null
  const chained = link >= 0
  const shown = chained ? 1 : Math.round(crowd * 40) / 40
  if (shown <= 0) return null
  return (
    <span
      className="absolute grid place-items-center"
      style={{
        ...box,
        opacity: shown,
        color: `color-mix(in oklab, var(--color-accent) ${front * 100}%, ${chained ? 'var(--color-fg)' : 'var(--color-fg-muted)'})`,
      }}
    >
      <Icon size={size} strokeWidth={1.5} active={active} trigger="none" />
    </span>
  )
}
