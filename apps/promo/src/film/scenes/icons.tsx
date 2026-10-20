import { useMemo, type CSSProperties } from 'react'
import { BellIcon, CheckIcon, HeartIcon, IconSwap, icons, LoaderRingIcon, StarIcon, type YoujIconComponent } from '@youj/icons'
import { mix, tween } from '../../lib/timing'
import { useFrame, useFrameValue } from '../../sim/simulation'
import { ICONS_BEATS } from '../beats'
import { useFormat, type Format } from '../format'
import { Keylines } from '../keylines'
import { ShotLabel } from '../label'
import { MACRO_SIZE } from './specimen'

/* The icons, in one move. It opens on the specimen's drawing board at macro
 * (the same frame the tokens chapter pushed into), where one icon morphs
 * through a chain (IconSwap's true path morph: star, heart, bell). The camera
 * pulls back to three neighbours on their keylines, each playing its own
 * choreography (the bell rings, the loader turns, the check draws), and keeps
 * pulling back until it is one cell in the whole set: every icon in the
 * library, a wave of choreographies passing through them, captioned in words
 * (no counts, so it never goes stale). The homepage loop runs the same field
 * on its own script: the morphs at macro, out to the set as the wave passes,
 * and back in to where it started.
 *
 * The lens is applied by layout, not by one transform on the wall: every cell
 * is placed and drawn at its size on screen. A 24× transform makes the
 * browser snap the magnified layer to whole local pixels (a quarter of a
 * pixel is six on screen), which would shift the close-up and shimmer the
 * pull-back. Laid out, every frame lands where the lens says. */

const ICON = 20

/* ── Scripts ───────────────────────────────────────────────────────────── */

type Framing = 'macro' | 'states' | 'whole'

export interface IconsScript {
  /** Camera moves: from `at`, over `length` frames, to a framing. It opens at macro. */
  moves: { at: number; to: Framing; length: number }[]
  /** The morphs at the home cell: each link from `at`, `length` frames long. */
  links: { at: number; from: YoujIconComponent; to: YoujIconComponent; length: number }[]
  /** When the three neighbours play their choreographies together (the bell rings too). */
  play?: number
  /** When the wave sets off through the set. */
  wave: number
  /** When the rest of the set arrives (the camera is on its way out to it). */
  arrive: number
  arriveLength: number
  /** When the keylines go, and (for a round trip) come back: they belong to the close-ups. */
  keylinesOut: number
  keylinesIn?: number
  /** Titles: the shot labels and the caption under the set. The loop has none. */
  titles?: { states: [number, number]; caption: number }
  /** A slow push toward the set once it is whole, from this frame. */
  drift?: number
}

const B = ICONS_BEATS
export const FILM_ICONS: IconsScript = {
  moves: [
    { at: B.states, to: 'states', length: B.statesLength },
    { at: B.wall, to: 'whole', length: B.wallLength },
  ],
  links: [
    { at: B.morph, from: StarIcon, to: HeartIcon, length: B.morphLength },
    { at: B.morph + B.link, from: HeartIcon, to: BellIcon, length: B.morphLength },
  ],
  play: B.play,
  wave: B.wave,
  arrive: B.wall - 6,
  arriveLength: B.wallLength * 0.7,
  keylinesOut: B.wall + 4,
  titles: { states: [B.states + B.statesLength - 16, B.wall], caption: B.caption },
  drift: B.wall + B.wallLength,
}

/* ── The field ─────────────────────────────────────────────────────────── */

interface Field {
  cols: number
  rows: number
  pitch: number
  /** The centre of the top-start cell. */
  origin: { x: number; y: number }
  home: { row: number; col: number }
  cells: (YoujIconComponent | 'home')[]
}

const NEIGHBOURS = [LoaderRingIcon, CheckIcon] as const

/** The set laid out for a stage: wide enough to fill it, every icon once, the home cell and its neighbours near the middle. */
function fieldFor(format: Format): Field {
  const cols = format.square ? 21 : format.loop ? 25 : 27
  const pitch = format.square ? 40 : 44
  const rows = Math.ceil(icons.length / cols)
  const middle = format.loop ? format.height / 2 : format.height * (format.square ? 0.47 : 0.46)
  const origin = { x: format.width / 2 - ((cols - 1) * pitch) / 2, y: middle - ((rows - 1) * pitch) / 2 }
  const home = { row: Math.floor(rows / 2), col: Math.floor(cols / 2) - 1 }
  const players = new Set<YoujIconComponent>([BellIcon, ...NEIGHBOURS])
  // A stable, well-mixed order: neighbours come from different categories.
  const rest = icons
    .filter((icon) => !players.has(icon))
    .map((icon, i) => ({ icon, key: (i * 7919) % icons.length }))
    .sort((a, b) => a.key - b.key)
    .map(({ icon }) => icon)
  const at = home.row * cols + home.col
  return { cols, rows, pitch, origin, home, cells: [...rest.slice(0, at), 'home', ...NEIGHBOURS, ...rest.slice(at)] }
}

/* ── The lens: a stage point shown at the frame's centre, at a scale ──── */

interface Lens {
  scale: number
  x: number
  y: number
}

const centre = (field: Field, row: number, col: number) => ({ x: field.origin.x + col * field.pitch, y: field.origin.y + row * field.pitch })

/** Zooms interpolate in log scale, so a pull-back reads at an even rate. */
function between(a: Lens, b: Lens, t: number): Lens {
  return { scale: Math.exp(mix(Math.log(a.scale), Math.log(b.scale), t)), x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) }
}

/**
 * The whole set, framed. The film and the square fit it between the HUD and
 * the caption under it, scaled down if it has to be, so the wall never runs
 * under either as the set grows; `captionTop` is where the caption goes.
 * The homepage loop has neither, and frames the set as it always has.
 */
function wholeFor(format: Format, field: Field): { lens: Lens; captionTop: number } {
  const middle = field.origin.y + ((field.rows - 1) * field.pitch) / 2
  if (format.loop) return { lens: { scale: 1, x: format.width / 2, y: middle }, captionTop: 0 }
  const w = (field.cols - 1) * field.pitch + ICON
  const h = (field.rows - 1) * field.pitch + ICON
  const top = 64
  const bottom = format.height - (format.square ? 96 : 110)
  const scale = Math.min(1, (bottom - top) / h, (format.width - 80) / w)
  const centreY = (top + bottom) / 2
  return {
    lens: { scale, x: format.width / 2, y: middle - (centreY - format.height / 2) / scale },
    captionTop: centreY + (h * scale) / 2 + (format.square ? 30 : 40),
  }
}

export function IconsScene({ leaveAt, script = FILM_ICONS }: { leaveAt: number; script?: IconsScript }) {
  const frame = useFrame()
  const format = useFormat()
  const { width, height, square, loop, tall, tile } = format
  const field = useMemo(() => fieldFor({ width, height, square, loop, tall, tile }), [width, height, square, loop, tall, tile])
  const cx = width / 2
  const cy = height / 2
  const home = centre(field, field.home.row, field.home.col)
  const whole = wholeFor(format, field)
  const framings: Record<Framing, Lens> = {
    macro: { scale: MACRO_SIZE / ICON, ...home },
    states: { scale: 7, ...centre(field, field.home.row, field.home.col + 1) },
    whole: whole.lens,
  }

  let lens = framings.macro
  for (const move of script.moves) lens = between(lens, framings[move.to], tween(frame, move.at, move.length, 'emphasized'))
  if (script.drift !== undefined) lens = { ...lens, scale: lens.scale * mix(1, 1.025, tween(frame, script.drift, 200, 'standard')) }

  const project = (p: { x: number; y: number }) => ({ x: cx + (p.x - lens.x) * lens.scale, y: cy + (p.y - lens.y) * lens.scale })
  /** A cell's box on screen, or null when it is out of frame. */
  const cellBox = (row: number, col: number): CSSProperties | null => {
    const c = project(centre(field, row, col))
    const size = ICON * lens.scale
    if (c.x + size < -40 || c.x - size > width + 40 || c.y + size < -40 || c.y - size > height + 40) return null
    return { left: c.x - size / 2, top: c.y - size / 2, width: size, height: size }
  }

  const out = tween(frame, leaveAt, 'slow', 'exit')
  const keylines = (1 - tween(frame, script.keylinesOut, 40, 'exit')) + (script.keylinesIn === undefined ? 0 : tween(frame, script.keylinesIn, 40, 'enter'))
  const neighbours = script.moves.find((m) => m.to === 'states')
  const link = script.links.reduce((at, l, i) => (frame >= l.at ? i : at), 0)
  const current = script.links[link]!
  const progress = tween(frame, current.at, current.length, 'emphasized')
  const titles = script.titles
  const morphLabel = titles ? tween(frame, 10, 'slow', 'enter') * (1 - tween(frame, titles.states[0] - 50, 'base', 'exit')) : 0

  return (
    <div className="absolute inset-0" style={{ opacity: 1 - out }}>
      <Board box={cellBox(field.home.row, field.home.col)} size={ICON * lens.scale} show={keylines} />
      {neighbours &&
        NEIGHBOURS.map((_, i) => (
          <Board
            key={i}
            box={cellBox(field.home.row, field.home.col + 1 + i)}
            size={ICON * lens.scale}
            show={keylines * tween(frame, neighbours.at, neighbours.length * 0.8, 'standard')}
          />
        ))}
      {field.cells.map((cell, i) => {
        const row = Math.floor(i / field.cols)
        const col = i % field.cols
        const box = cellBox(row, col)
        if (cell === 'home') return <Home key="home" box={box} size={ICON * lens.scale} script={script} wave={waveAt(script.wave, row, col)} link={link} progress={progress} />
        const neighbour = row === field.home.row && col > field.home.col && col <= field.home.col + NEIGHBOURS.length
        return <Cell key={cell.meta.name} Icon={cell} box={box} size={ICON * lens.scale} script={script} wave={waveAt(script.wave, row, col)} neighbour={neighbour} />
      })}
      {titles && (
        <>
          <ShotLabel name="IconSwap · morph" detail={`${current.from.meta.name} → ${current.to.meta.name}`} show={morphLabel} />
          <StateLabels frame={frame} window={titles.states} at={(i) => project(centre(field, field.home.row, field.home.col + i))} scale={lens.scale} />
          <Caption frame={frame} at={titles.caption} top={whole.captionTop} />
        </>
      )}
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

/** When the wave reaches a cell, and how long its choreography plays. */
const waveAt = (wave: number, row: number, col: number) => wave + col * 2.2 + row * 3.4
const PLAY = 64

function Cell({
  Icon,
  box,
  size,
  script,
  wave,
  neighbour,
}: {
  Icon: YoujIconComponent
  box: CSSProperties | null
  size: number
  script: IconsScript
  wave: number
  neighbour: boolean
}) {
  const play = script.play
  const player = neighbour && play !== undefined
  // The neighbours play with the bell first, at the close-up; everyone plays when the wave passes.
  const active = useFrameValue((f) => (player && f >= play! && f < play! + 150) || (f >= wave && f < wave + PLAY))
  const front = useFrameValue((f) => Math.round(Math.max(0, 1 - Math.abs(f - wave - 8) / 12) * 20) / 20)
  // The rest of the set arrives as the camera pulls back to it.
  const shown = useFrameValue((f) => (player ? 1 : Math.round(tween(f, script.arrive, script.arriveLength, 'standard') * 20) / 20))
  return (
    <span
      className="absolute grid place-items-center"
      style={{
        ...(box ?? { display: 'none' }),
        opacity: shown,
        color: `color-mix(in oklab, var(--color-accent) ${front * 100}%, ${player ? 'var(--color-fg)' : 'var(--color-fg-muted)'})`,
      }}
    >
      <Icon size={size} strokeWidth={1.5} active={active} trigger="none" />
    </span>
  )
}

/** The home cell: its chain of morphs, and between them the icon it has landed on, playing when it is its turn. */
function Home({
  box,
  size,
  script,
  wave,
  link,
  progress,
}: {
  box: CSSProperties | null
  size: number
  script: IconsScript
  wave: number
  link: number
  progress: number
}) {
  const current = script.links[link]!
  const play = script.play
  const active = useFrameValue((f) => (play !== undefined && f >= play && f < play + 90) || (f >= wave && f < wave + PLAY))
  if (!box) return null
  // At rest the landed icon is itself (so it can play its own choreography, the bell's ring); mid-morph it is the swap.
  const Landed = progress >= 1 ? current.to : current.from
  const resting = progress <= 0 || progress >= 1
  return (
    <span className="absolute grid place-items-center text-fg" style={box}>
      {resting ? (
        <Landed size={size} strokeWidth={1.5} active={active} trigger="none" />
      ) : (
        <IconSwap from={current.from} to={current.to} progress={progress} transition="morph" size={size} strokeWidth={1.5} />
      )}
    </span>
  )
}

/** Under each of the three at the close-up: its name and its choreography. */
function StateLabels({ frame, window, at, scale }: { frame: number; window: [number, number]; at: (i: number) => { x: number; y: number }; scale: number }) {
  const show = tween(frame, window[0], 'slow', 'enter') * (1 - tween(frame, window[1], 'base', 'exit'))
  if (show <= 0) return null
  const labels = [
    { name: 'bell', detail: 'ring' },
    { name: 'loader-ring', detail: 'loop' },
    { name: 'check', detail: 'draw' },
  ]
  return (
    <>
      {labels.map((label, i) => {
        const { x, y: cy } = at(i)
        const y = cy + (ICON / 2) * scale + 34
        return (
          <p
            key={label.name}
            className="absolute flex items-center gap-2.5 font-mono leading-none whitespace-nowrap"
            style={{ left: x, top: y, opacity: show, transform: `translate(-50%, ${(1 - show) * 6}px)` }}
          >
            <span aria-hidden className="size-2 rounded-[1.5px] bg-accent" />
            <span className="text-[14px] tracking-[0.1em] text-fg uppercase">{label.name}</span>
            <span className="text-[13.5px] tracking-[0.02em] text-fg-muted">{label.detail}</span>
          </p>
        )
      })}
    </>
  )
}

/** Under the whole set, in words: no count, so the film never goes stale as the set grows. */
function Caption({ frame, at, top }: { frame: number; at: number; top: number }) {
  const show = (i: number) => tween(frame, at + i * 6, 'slow', 'enter')
  if (frame < at) return null
  return (
    <div className="absolute inset-x-0 flex items-baseline justify-center gap-5" style={{ top }}>
      <p className="text-[34px] leading-none font-semibold tracking-[-0.035em] text-fg" style={{ opacity: show(0), transform: `translateY(${(1 - show(0)) * 10}px)` }}>
        Icons that move
      </p>
      <span aria-hidden className="size-1.5 self-center rounded-[1px] bg-accent" style={{ opacity: show(1) }} />
      <p className="text-[34px] leading-none font-semibold tracking-[-0.035em] text-fg-muted" style={{ opacity: show(1), transform: `translateY(${(1 - show(1)) * 10}px)` }}>
        with intent
      </p>
    </div>
  )
}
