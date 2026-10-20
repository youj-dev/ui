/* The render loop shared by the canvas / WebGL2 backgrounds: sizing (DPR-capped ResizeObserver), a rAF
 * loop whose clock honors speed and 1 / timeScale, pausing offscreen and in hidden tabs, and a single
 * static frame under reduced motion. */

import { observeOnScreen } from '@youj/core/lib/youj/on-screen'


export interface LoopSettings {
  reduced: boolean
  timeScale: number
  speed: number
  /** Overrides the loop's maxDpr (the low tier's cap). Applied on the next sync or resize. */
  maxDpr?: number
  /** Render at most this many frames per second. 0 or unset: every display frame. */
  fps?: number
}

export interface FrameSize {
  /** Device pixels. */
  width: number
  height: number
  dpr: number
}

export interface RenderLoopOptions {
  canvas: HTMLCanvasElement
  /** Upper bound for devicePixelRatio. */
  maxDpr: number
  /** Clock value used for the single reduced-motion frame. */
  staticTime: number
  /** Read on every frame, so speed / time-scale changes apply without a restart. */
  settings: () => LoopSettings
  /**
   * `time` is the piece's clock: seconds × speed / timeScale, frozen while paused.
   * `dt` is the real frame delta / timeScale (no speed), for physics and smoothing.
   */
  render: (time: number, dt: number, size: FrameSize) => void
}

export interface RenderLoop {
  /** Redraws once if the loop isn't running (reduced motion, paused). Running loops pick changes up next frame. */
  invalidate(): void
  /** Re-reads settings and starts/stops the rAF loop accordingly. */
  sync(): void
  destroy(): void
}

const MAX_DT = 0.1
/** Frames arriving this much early still count as due, so a 30 fps cap holds on jittery 60 Hz timing. */
const FRAME_SLACK_MS = 2

export function createRenderLoop({ canvas, maxDpr, staticTime, settings, render }: RenderLoopOptions): RenderLoop {
  const size: FrameSize = { width: 0, height: 0, dpr: 1 }
  let raf = 0
  let last = 0
  let time = staticTime
  let onscreen = true
  let destroyed = false

  const measure = () => {
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, settings().maxDpr ?? maxDpr)
    const width = Math.max(0, Math.round(rect.width * dpr))
    const height = Math.max(0, Math.round(rect.height * dpr))
    if (width !== canvas.width) canvas.width = width
    if (height !== canvas.height) canvas.height = height
    size.width = width
    size.height = height
    size.dpr = dpr
  }

  const running = () => !destroyed && !settings().reduced && onscreen && !document.hidden

  // Static redraws are coalesced: a burst of invalidations (mount, theme + prop change) yields one frame.
  let pending = false
  const drawOnce = () => {
    if (pending) return
    pending = true
    queueMicrotask(() => {
      pending = false
      if (destroyed || running() || !size.width || !size.height) return
      render(settings().reduced ? staticTime : time, 0, size)
    })
  }

  const tick = (now: number) => {
    raf = 0
    if (!running()) return
    const s = settings()
    if (s.fps && last && now - last < 1000 / s.fps - FRAME_SLACK_MS) {
      raf = requestAnimationFrame(tick)
      return
    }
    const dt = last ? Math.min((now - last) / 1000, MAX_DT) : 0
    last = now
    const scale = 1 / Math.max(s.timeScale, 1e-3)
    time += dt * s.speed * scale
    if (size.width && size.height) render(time, dt * scale, size)
    raf = requestAnimationFrame(tick)
  }

  const sync = () => {
    if (!destroyed) measure()
    if (running()) {
      if (!raf) raf = requestAnimationFrame(tick)
      return
    }
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    last = 0
    if (settings().reduced) drawOnce()
  }

  // A new size clears the canvas, and this runs after the frame's own render: draw again now, or the cleared canvas
  // paints for a frame (a background under a stage easing its height flashes blank on every frame of the ease).
  const resizeObserver = new ResizeObserver(() => {
    const before = `${canvas.width}x${canvas.height}`
    measure()
    if (!running()) drawOnce()
    else if (before !== `${canvas.width}x${canvas.height}` && size.width && size.height) render(time, 0, size)
  })
  resizeObserver.observe(canvas)

  const stopOnScreen = observeOnScreen(
    canvas,
    (next) => {
      onscreen = next
      sync()
    },
    { rootMargin: '64px' },
  )

  measure()
  if (running()) sync()
  else drawOnce()

  return {
    invalidate: () => {
      if (!running()) drawOnce()
    },
    sync,
    destroy: () => {
      destroyed = true
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      resizeObserver.disconnect()
      stopOnScreen()
    },
  }
}
