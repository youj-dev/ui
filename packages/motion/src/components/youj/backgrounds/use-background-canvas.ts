/* The React glue: the hook owns its <canvas>, so every mount gets a fresh context and every unmount can
 * release it for good. The motion budget applies here: on the 'low' tier (useMotionBudget) the loop caps
 * the DPR at 1 and renders at 30 fps, and pieces get `low` to lighten their own work. */

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useYouj, useMotionBudget } from '@youj/core/lib/youj/provider'
import type { Rgb } from './color'
import { createRenderLoop, type FrameSize, type RenderLoop } from './render-loop'
import { observeTheme, resolveColors } from './resolve-colors'
import { createShaderRenderer, type Uniforms } from './webgl'


export interface PointerState {
  /** Smoothed position in CSS px relative to the canvas. */
  x: number
  y: number
  /** 0–1, eases in while the pointer is over the canvas and out when it leaves. */
  strength: number
  /** Presses since the last frame, CSS px. The piece drains this. */
  presses: { x: number; y: number }[]
}

export interface FrameInfo extends FrameSize {
  time: number
  dt: number
  colors: readonly Rgb[]
  pointer: PointerState
  reduced: boolean
  /** The low motion-budget tier: the loop already caps DPR and frame rate; pieces may shed work too. */
  low: boolean
}

export interface CanvasRenderer {
  frame(info: FrameInfo): void
  dispose(): void
}

export interface BackgroundCanvasOptions {
  /** CSS colors (tokens or any CSS color), resolved at runtime and on theme change. */
  colors: readonly string[]
  speed: number
  interactive: boolean
  maxDpr?: number
  staticTime?: number
  /** Frame rate on the low tier. Default 30. */
  lowFps?: number
  /** Frame rate on every tier, for a piece that drifts too slowly to need more (the low tier's, if lower, still applies). Default: every display frame. */
  fps?: number
  /** Called once per mount with a fresh canvas. Return null if the context is unavailable. */
  create: (canvas: HTMLCanvasElement, invalidate: () => void) => CanvasRenderer | null
}

const POINTER_FOLLOW = 9
const POINTER_FADE = 3
const LOW_MAX_DPR = 1
const LOW_FPS = 30

/** Mounts a canvas into `hostRef`, drives it, and reports `failed` so the caller can show a fallback. */
export function useBackgroundCanvas(hostRef: RefObject<HTMLElement | null>, options: BackgroundCanvasOptions) {
  const k = useYouj()
  const low = useMotionBudget().tier === 'low'
  const [failed, setFailed] = useState(false)
  const latest = useRef({ options, reduced: k.reduced, timeScale: k.timeScale, low })
  // Written in a layout effect, not during render, so a render React discards never leaves its values behind.
  useLayoutEffect(() => {
    latest.current = { options, reduced: k.reduced, timeScale: k.timeScale, low }
  })
  const loopRef = useRef<RenderLoop | null>(null)
  const colorsRef = useRef<Rgb[]>([])
  const pointer = useRef<PointerState & { tx: number; ty: number; inside: boolean }>({
    x: 0, y: 0, tx: 0, ty: 0, strength: 0, inside: false, presses: [],
  })
  const colorKey = options.colors.join('|')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'
    host.appendChild(canvas)

    let loop: RenderLoop | null = null
    const renderer = latest.current.options.create(canvas, () => loop?.invalidate())
    if (!renderer) {
      canvas.remove()
      setFailed(true)
      return
    }
    colorsRef.current = resolveColors(host, latest.current.options.colors)
    // A theme change marks the colors stale; they're re-read in the next frame
    // drawn. Reading them in the observer forced a full style recalculation per
    // mutation (a preset switch fires several) before the page's own one.
    let stale = false

    loop = createRenderLoop({
      canvas,
      maxDpr: latest.current.options.maxDpr ?? 2,
      staticTime: latest.current.options.staticTime ?? 12,
      settings: () => {
        const { options, low } = latest.current
        const fps = Math.min(options.fps ?? Infinity, low ? options.lowFps ?? LOW_FPS : Infinity)
        return {
          reduced: latest.current.reduced,
          timeScale: latest.current.timeScale,
          speed: options.speed,
          ...(low ? { maxDpr: Math.min(LOW_MAX_DPR, options.maxDpr ?? 2) } : {}),
          ...(Number.isFinite(fps) ? { fps } : {}),
        }
      },
      render: (time, dt, size) => {
        if (stale) {
          stale = false
          colorsRef.current = resolveColors(host, latest.current.options.colors)
        }
        const p = pointer.current
        const follow = 1 - Math.exp(-dt * POINTER_FOLLOW)
        p.x += (p.tx - p.x) * follow
        p.y += (p.ty - p.y) * follow
        p.strength += ((p.inside ? 1 : 0) - p.strength) * (1 - Math.exp(-dt * POINTER_FADE))
        renderer.frame({
          ...size,
          time,
          dt,
          colors: colorsRef.current,
          pointer: p,
          reduced: latest.current.reduced,
          low: latest.current.low,
        })
        p.presses.length = 0
      },
    })
    loopRef.current = loop
    const stopTheme = observeTheme(() => {
      stale = true
      loop?.invalidate()
    }, host)

    return () => {
      stopTheme()
      loop?.destroy()
      loopRef.current = null
      renderer.dispose()
      canvas.remove()
    }
    // The canvas lives for the whole mount; everything else is read through `latest`.
  }, [])

  // Explicit colors changed: re-resolve.
  useEffect(() => {
    const host = hostRef.current
    if (!host || !loopRef.current) return
    colorsRef.current = resolveColors(host, latest.current.options.colors)
    loopRef.current.invalidate()
  }, [colorKey, hostRef])

  // Reduced motion / time scale / budget tier: start, stop, resize, or redraw the static frame.
  useEffect(() => {
    loopRef.current?.sync()
  }, [k.reduced, k.timeScale, low])

  // Any prop change redraws a static frame (no-op while animating).
  useEffect(() => {
    loopRef.current?.invalidate()
  })

  // Pointer: tracked on window, because the background sits under content that takes the events.
  const tracking = options.interactive && !k.reduced
  useEffect(() => {
    const host = hostRef.current
    const p = pointer.current
    if (!tracking || !host) {
      p.inside = false
      p.strength = 0
      return
    }
    const locate = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height }
    }
    const onMove = (event: PointerEvent) => {
      const { x, y, inside } = locate(event)
      if (inside && !p.inside && p.strength < 0.01) {
        p.x = x
        p.y = y
      }
      p.tx = x
      p.ty = y
      p.inside = inside
    }
    const onDown = (event: PointerEvent) => {
      const { x, y, inside } = locate(event)
      if (inside && p.presses.length < 8) p.presses.push({ x, y })
    }
    const onLeave = () => {
      p.inside = false
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      p.inside = false
    }
  }, [tracking, hostRef])

  return { failed }
}

export interface ShaderBackgroundOptions extends Omit<BackgroundCanvasOptions, 'create'> {
  /** Fragment body; the shared prelude (noise, OKLab, dither, uResolution/uTime/uDpr) is prepended. */
  fragment: string
  /** Sets piece-specific uniforms each frame. */
  uniforms: (u: Uniforms, info: FrameInfo) => void
}

/** useBackgroundCanvas for a single full-screen fragment shader. */
export function useShaderBackground(hostRef: RefObject<HTMLElement | null>, options: ShaderBackgroundOptions) {
  const setUniforms = useRef(options.uniforms)
  setUniforms.current = options.uniforms
  const { fragment } = options

  return useBackgroundCanvas(hostRef, {
    ...options,
    create: (canvas, invalidate) => {
      const renderer = createShaderRenderer(canvas, fragment, invalidate)
      if (!renderer) return null
      return {
        frame: (info) => {
          if (!renderer.begin(info)) return
          renderer.uniforms.vec2('uResolution', info.width, info.height)
          renderer.uniforms.float('uTime', info.time)
          renderer.uniforms.float('uDpr', info.dpr)
          setUniforms.current(renderer.uniforms, info)
          renderer.draw()
        },
        dispose: renderer.dispose,
      }
    },
  })
}
