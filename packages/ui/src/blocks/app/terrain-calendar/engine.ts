import { FLOOR_HEIGHT, TALL, cellAt, type Frame } from './geometry'
import { drawScene, type Paint } from './paint'

/* The terrain's canvas, driven without React: what's drawn lives in typed
 * arrays and every change is a tween from where things are now, so a new
 * measure or sport mid-flight carries on from the current shape and never
 * jumps. It draws only when something changed, once per display frame at
 * most, and never while the canvas is off screen or the tab is hidden (a
 * tween that ends meanwhile is simply drawn finished).
 *
 * - Readings: each cell's share of the peak, blended from the old shares to
 *   the new in a wave from the oldest week to this one.
 * - Receding: while a cell is looked at, the columns off its row and week
 *   fall back toward the floor.
 * - Rising: the first readings wait on the floor until the canvas is first
 *   seen, then rise from the far corner forward.
 * Reduced motion: every change lands at once. */

export interface Tween {
  /** Each cell's own duration, ms. */
  duration: number
  /** How far the wave spreads the cells' starts, ms. */
  spread: number
  ease: (t: number) => number
}

export interface Timing {
  reduced: boolean
  rise: Tween
  morph: Tween
  recede: Tween
}

export interface GridCell {
  row: number
  col: number
}

const clamp01 = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t)
const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now())

export function createEngine(canvas: HTMLCanvasElement, initial: Frame, onActivity?: (running: boolean) => void) {
  const { rows, cols } = initial
  const n = rows * cols
  const ctx = canvas.getContext('2d')
  const from = new Float32Array(n)
  const to = new Float32Array(n)
  const blend = new Float32Array(n)
  const delays = new Float32Array(n)
  const heights = new Float32Array(n).fill(FLOOR_HEIGHT)
  let frame = initial
  let morph: Tween | null = null
  let morphStart = -Infinity
  let dim = 0
  let dimFrom = 0
  let dimTo = 0
  let dimStart = -Infinity
  let timing: Timing | null = null
  // The first readings wait on the floor for the canvas to be seen.
  let rising = true
  let seeded = false
  let paint: Paint | null = null
  let px = 0
  let dpr = 1
  let seen = false
  let shown = typeof document === 'undefined' || document.visibilityState !== 'hidden'
  let raf = 0
  let running = false
  let active: GridCell | null = null
  let pinned: GridCell | null = null
  let rect: DOMRect | null = null

  const live = () => seen && shown && !!timing && !timing.reduced

  /** Brings every array to time `t`; true while something is still moving. */
  function step(t: number) {
    let moving = false
    for (let i = 0; i < n; i++) {
      if (rising) blend[i] = from[i]!
      else {
        const p = morph ? clamp01((t - morphStart - delays[i]!) / morph.duration) : 1
        if (p < 1) moving = true
        blend[i] = p === 1 ? to[i]! : from[i]! + (to[i]! - from[i]!) * morph!.ease(p)
      }
      heights[i] = Math.max(FLOOR_HEIGHT, blend[i]! * TALL)
    }
    const recede = timing?.recede
    const d = recede ? clamp01((t - dimStart) / recede.duration) : 1
    if (d < 1) moving = true
    dim = d === 1 ? dimTo : dimFrom + (dimTo - dimFrom) * recede!.ease(d)
    return moving
  }

  function render() {
    if (!ctx || !paint || !px) return
    const apart = pinned && (!active || active.row !== pinned.row || active.col !== pinned.col)
    drawScene(ctx, { frame, heights, active, pinned: apart ? pinned : null, dim }, paint, px, dpr)
  }

  function setRunning(next: boolean) {
    if (next === running) return
    running = next
    onActivity?.(next)
  }

  function tick(t: number) {
    raf = 0
    const moving = step(t)
    render()
    setRunning(moving)
    if (moving) schedule()
  }

  function schedule() {
    if (raf || !seen || !shown || typeof requestAnimationFrame === 'undefined') return
    raf = requestAnimationFrame(tick)
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    setRunning(false)
  }

  /** Each cell's start in a wave: `along` 0 to 1 across the grid. */
  function wave(tween: Tween, along: (row: number, col: number) => number) {
    for (let i = 0; i < n; i++) delays[i] = tween.spread * along(Math.floor(i / cols), i % cols)
  }

  /** The rise from the floor, once there are readings, timing, and someone to see it: from the far corner forward. */
  function rise() {
    if (!rising || !seeded || !timing || !seen || !shown) return
    rising = false
    morph = timing.rise
    morphStart = now()
    wave(morph, (row, col) => (row + col) / Math.max(1, rows + cols - 2))
    schedule()
  }

  return {
    /** Each cell's share of the peak, rows × columns. The first readings wait on the floor to rise when seen. */
    setShares(shares: Float32Array) {
      const t = now()
      step(t)
      from.set(blend)
      to.set(shares)
      if (!seeded) {
        seeded = true
        rise()
      } else if (!rising) {
        if (live()) {
          morph = timing!.morph
          morphStart = t
          // Oldest week to newest, the back rows a touch ahead.
          wave(morph, (row, col) => (col / Math.max(1, cols - 1)) * 0.85 + (row / Math.max(1, rows - 1)) * 0.15)
        } else morphStart = -Infinity
      }
      schedule()
    },
    /** While a cell is looked at, the rest recede. */
    setLooking(on: boolean) {
      const t = now()
      step(t)
      dimFrom = dim
      dimTo = on ? 1 : 0
      dimStart = live() ? t : -Infinity
      schedule()
    },
    setCells(nextActive: GridCell | null, nextPinned: GridCell | null) {
      active = nextActive
      pinned = nextPinned
      schedule()
    },
    setPaint(next: Paint) {
      paint = next
      schedule()
    },
    setTiming(next: Timing) {
      timing = next
      if (next.reduced) {
        // Everything lands: no rise, no tween left running.
        rising = false
        morphStart = dimStart = -Infinity
      }
      rise()
      schedule()
    },
    /** The drawing's extent (same grid): the box resizes with it, and the size that follows redraws. */
    setFrame(next: Frame) {
      if (next.rows !== rows || next.cols !== cols) return
      frame = next
      rect = null
    },
    /** The canvas's size in CSS pixels and its pixel ratio: resizes the backing store and redraws at once, so no frame shows it blank. */
    resize(width: number, height: number, ratio: number) {
      rect = null
      if (!width || !height) return
      px = width / frame.width
      dpr = ratio
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      step(now())
      render()
    },
    setSeen(next: boolean) {
      seen = next
      if (!next) return stop()
      rise()
      schedule()
    },
    setShown(next: boolean) {
      shown = next
      if (!next) return stop()
      rise()
      schedule()
    },
    /** Forget the canvas's place on the page (it scrolled or moved). */
    moved() {
      rect = null
    },
    /** The cell under a pointer, or null. */
    pick(clientX: number, clientY: number): GridCell | null {
      step(now())
      rect ??= canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return null
      const x = frame.x + ((clientX - rect.left) / rect.width) * frame.width
      const y = frame.y + ((clientY - rect.top) / rect.height) * frame.height
      return cellAt(frame, (r, c) => heights[r * cols + c]!, [x, y])
    },
    /** The drawn heights, grid units, brought up to now. */
    heights() {
      step(now())
      return heights
    },
    get running() {
      return running
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    },
  }
}

export type TerrainEngine = ReturnType<typeof createEngine>
