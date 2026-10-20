import { ScrambleText } from '@youj/motion'
import { YoujLockup, YoujMark, YoujWordmark } from '@youj/core/docs/brand/youj-logo'
import { LOCKUP_EM, LOCKUP_GAP, LOCKUP_WORD_SCALE, LOCKUP_WORD_Y, WORDMARK_WIDTH } from '@youj/core/docs/brand/logo'
import { mix, tween } from '../lib/timing'
import { Seq, useFrame } from '../sim/simulation'

/** The brand lockup, from the motion package's own logo. The one place the film imports it. */
export { YoujLockup as Lockup, YoujMark as Mark }

/* The lockup is one element for the whole film. The cold open draws the mark
 * out of a graph and hands it over here, at the same size and place, the
 * moment it is whole (`from`). The mark then makes room, the wordmark rises
 * through its baseline (the logo's own choreography), the lockup travels to
 * the top-left to be the HUD for every chapter, and comes back to centre for
 * the end card. The HUD caption decodes each chapter's name beside it.
 * Everything is placed from the logo's own geometry (LOCKUP_EM), so a redrawn
 * logo keeps its place in every frame. */

/** Lockup height at centre stage and in the HUD, in CSS px. */
export const BIG = 64
const SMALL = 16
export const HUD = { x: 32, y: 26 }
export { LOCKUP_EM }

/** Where the mark is when the cold open hands it over: centred on `at`, `size` tall. */
export interface MarkHandover {
  at: { x: number; y: number }
  size: number
}

export interface BrandMove {
  /** The frame the lockup takes over the mark, and the mark's size and place then. */
  from: number
  mark: MarkHandover
  /** Frames the mark takes to make room for the wordmark. */
  settle: number
  /** Centre-stage vertical centre, as a fraction of the height. */
  centerY: number
  /** Frame the lockup starts for the HUD, and how long it takes. */
  toHud: { start: number; length: number }
  /** Frame it starts back to centre stage (for the end card). */
  toCenter?: { start: number; length: number }
  /** End-card vertical centre, as a fraction of the height. */
  endY?: number
  /** End-card lockup height. */
  endSize?: number
}

interface Box {
  x: number
  y: number
  size: number
}

const lerp = (a: Box, b: Box, t: number): Box => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), size: mix(a.size, b.size, t) })

export function Brand({ width, height, move, captions }: { width: number; height: number; move: BrandMove; captions: [number, string][] }) {
  const frame = useFrame()
  if (frame < move.from) return null

  const place = (size: number, fy: number): Box => ({ x: width / 2 - (LOCKUP_EM * size) / 2, y: height * fy - size / 2, size })
  const center = place(BIG, move.centerY)
  const end = place(move.endSize ?? BIG, move.endY ?? move.centerY)
  const hud: Box = { ...HUD, size: SMALL }

  const toHud = tween(frame, move.toHud.start, move.toHud.length, 'emphasized')
  const toCenter = move.toCenter ? tween(frame, move.toCenter.start, move.toCenter.length, 'emphasized') : 0
  const lockup = toCenter > 0 ? lerp(hud, end, toCenter) : lerp(center, hud, toHud)

  // The handed-over mark makes room for the wordmark: from where the cold open left it to its place in the lockup.
  const made = tween(frame, move.from, move.settle, 'emphasized')
  const handed: Box = { x: move.mark.at.x - move.mark.size / 2, y: move.mark.at.y - move.mark.size / 2, size: move.mark.size }
  const mark = made < 1 ? lerp(handed, lockup, made) : lockup
  const word = {
    x: lockup.x + lockup.size * (1 + LOCKUP_GAP / 24),
    y: lockup.y + (lockup.size * LOCKUP_WORD_Y) / 24,
    size: lockup.size * LOCKUP_WORD_SCALE,
  }

  // The caption shows while the lockup rests in the HUD.
  const captionIn = tween(frame, move.toHud.start + move.toHud.length - 6, 'base', 'enter')
  const captionOut = move.toCenter ? tween(frame, move.toCenter.start, 'fast', 'exit') : 0
  const caption = captions.filter(([at]) => frame >= at).at(-1)?.[1]

  return (
    <>
      {/* The wordmark sits under the mark, so letters rising where the mark has just been never show through it. */}
      <div
        className="absolute top-0 left-0"
        style={{ transform: `translate(${word.x}px, ${word.y}px)`, height: word.size, width: (word.size * WORDMARK_WIDTH) / 24 }}
      >
        <Seq from={move.from + Math.round(move.settle * 0.45)}>
          <YoujWordmark animated className="h-full" />
        </Seq>
      </div>
      <div className="absolute top-0 left-0" style={{ transform: `translate(${mark.x}px, ${mark.y}px)`, width: mark.size, height: mark.size }}>
        <YoujMark className="size-full" />
      </div>
      {caption && (
        <div
          className="absolute flex items-center gap-3 font-mono text-[13px] leading-none tracking-[0.12em] text-fg-subtle uppercase"
          style={{
            left: HUD.x + LOCKUP_EM * SMALL + 12,
            top: HUD.y,
            height: SMALL,
            opacity: captionIn * (1 - captionOut),
            transform: `translateX(${(1 - captionIn) * -4}px)`,
          }}
        >
          <span aria-hidden className="h-3.5 w-px bg-line-strong" />
          <ScrambleText className="text-fg-muted" tick="fast">
            {caption}
          </ScrambleText>
        </div>
      )}
    </>
  )
}
