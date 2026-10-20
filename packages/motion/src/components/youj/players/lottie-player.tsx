import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import { DotLottieReact, type DotLottie, type Fit, type Layout, type RenderConfig } from '@lottiefiles/dotlottie-react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { useInView, useThemeChange } from './use-player-env'

export type LottieFrame = number | 'first' | 'last'

export interface LottiePlayerProps extends Omit<ComponentProps<'div'>, 'children' | 'onLoad' | 'onError'> {
  /** URL of a `.lottie` or Lottie `.json` file. */
  src?: string
  /** Inline animation data, instead of `src`. */
  data?: string | ArrayBuffer | Record<string, unknown>
  /** Play once loaded and in view. */
  autoplay?: boolean
  loop?: boolean
  /** Hover (or focus within) plays forward; leaving plays back in reverse from wherever it is. */
  playOnHover?: boolean
  /** Start playing the first time the player scrolls into view. */
  playOnView?: boolean
  /** Restrict playback to a frame range, e.g. `[0, 30]`. */
  segment?: [number, number]
  /** Controlled playback. Overrides autoplay / playOnView / playOnHover while defined. */
  playing?: boolean
  /** Playback rate before time-scaling. The effective speed is `speed / timeScale`. */
  speed?: number
  /** Frame shown when motion is reduced. Default `'last'` (the resolved state). */
  posterFrame?: LottieFrame
  /**
   * Color slot bindings: slot id → youj color token (`'accent'`, `'fg-muted'`…)
   * or any CSS color expression. Slots whose id is itself a token name bind
   * automatically, so youj samples need no mapping.
   */
  slots?: Record<string, string>
  /** Follow youj color tokens and live theme changes. Default true. */
  themed?: boolean
  fit?: Fit
  /** Alignment in the box as [x, y] in 0–1. Default centered. */
  align?: [number, number]
  /** Accessible name. Without it the player is decorative (`aria-hidden`). */
  label?: string
  onComplete?: () => void
  onLoad?: (player: DotLottie) => void
  /** A load failed: the file couldn't be fetched, or isn't a Lottie or dotLottie animation. */
  onError?: (error: Error) => void
}

const RENDER_CONFIG: RenderConfig = { autoResize: true, freezeOnOffscreen: false }

/* The player fetches `src` itself and hands dotLottie the data. dotLottie's
 * own fetch is aborted when its instance unmounts mid-load, and it logs that
 * abort as a failed load, so a remount (a hydration pass, StrictMode) printed
 * an error on every page. Requests are shared by URL while in flight, so a
 * remount picks up the same request instead of aborting and starting over. */
const inFlight = new Map<string, Promise<ArrayBuffer | string>>()

function fetchAnimation(url: string) {
  let request = inFlight.get(url)
  if (!request) {
    request = fetch(url)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Failed to load animation from ${url}: ${response.status} ${response.statusText}`)
        const bytes = await response.arrayBuffer()
        // As dotLottie decides: a .lottie is a zip and stays binary; anything else is Lottie JSON text.
        return isZip(bytes) ? bytes : new TextDecoder().decode(bytes)
      })
      .finally(() => inFlight.delete(url))
    inFlight.set(url, request)
  }
  return request
}

function isZip(bytes: ArrayBuffer) {
  const head = new Uint8Array(bytes, 0, Math.min(4, bytes.byteLength))
  return head.length === 4 && head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04
}

/**
 * dotLottie wrapper that follows the youj contract: speed follows the time
 * scale, reduced motion shows a poster frame, playback pauses offscreen, and
 * color slots track the theme tokens live.
 */
export function LottiePlayer({
  src,
  data,
  autoplay = false,
  loop = false,
  playOnHover = false,
  playOnView = false,
  segment,
  playing,
  speed = 1,
  posterFrame = 'last',
  slots,
  themed = true,
  fit = 'contain',
  align,
  label,
  onComplete,
  onLoad,
  onError,
  className,
  ...rest
}: LottiePlayerProps) {
  const k = useYouj()
  const rootRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const [player, setPlayer] = useState<DotLottie | null>(null)
  const [loads, setLoads] = useState(0)
  const finished = useRef(false)
  const [hovered, setHovered] = useState(false)
  const seen = useRef(false)
  const inView = useInView(rootRef)

  const callbacks = useRef({ onComplete, onLoad, onError })
  callbacks.current = { onComplete, onLoad, onError }

  // `src` is fetched here, not by dotLottie (see fetchAnimation).
  const inline = data !== undefined
  const [file, setFile] = useState<{ src: string; data: ArrayBuffer | string } | null>(null)
  useEffect(() => {
    if (!src || inline) return
    let live = true
    fetchAnimation(src).then(
      (loaded) => live && setFile({ src, data: loaded }),
      (error: unknown) => live && callbacks.current.onError?.(error instanceof Error ? error : new Error(String(error))),
    )
    return () => {
      live = false
    }
  }, [src, inline])
  const animation = inline ? data : file && file.src === src ? file.data : undefined

  // dotLottie drops a load that arrives before its wasm is up, so the data waits for this instance to be ready.
  const [readyPlayer, setReadyPlayer] = useState<DotLottie | null>(null)
  useEffect(() => {
    if (!player) return
    const markReady = () => setReadyPlayer(player)
    if (player.isReady) markReady()
    player.addEventListener('ready', markReady)
    return () => player.removeEventListener('ready', markReady)
  }, [player])
  const ready = player !== null && readyPlayer === player

  useEffect(() => {
    if (!player) return
    const handleLoad = () => {
      finished.current = false
      setLoads((n) => n + 1)
      callbacks.current.onLoad?.(player)
    }
    const handleComplete = () => {
      finished.current = true
      callbacks.current.onComplete?.()
    }
    const handleError = ({ error }: { error: Error }) => callbacks.current.onError?.(error)
    player.addEventListener('load', handleLoad)
    player.addEventListener('complete', handleComplete)
    player.addEventListener('loadError', handleError)
    if (player.isLoaded) handleLoad()
    return () => {
      player.removeEventListener('load', handleLoad)
      player.removeEventListener('complete', handleComplete)
      player.removeEventListener('loadError', handleError)
    }
  }, [player])

  const [segStart, segEnd] = segment ?? []
  const stableSegment = useMemo<[number, number] | undefined>(
    () => (segStart === undefined || segEnd === undefined ? undefined : [segStart, segEnd]),
    [segStart, segEnd],
  )
  const [alignX, alignY] = align ?? [0.5, 0.5]
  const layout = useMemo<Layout>(() => ({ fit, align: [alignX, alignY] }), [fit, alignX, alignY])

  // Playback. One place decides what the player should be doing.
  useEffect(() => {
    if (!player || loads === 0) return
    if (inView) seen.current = true
    if (k.reduced) {
      player.pause()
      player.setFrame(resolveFrame(posterFrame, player, stableSegment))
      return
    }
    if (!inView) {
      player.pause()
      return
    }
    if (playing !== undefined) {
      // A finished run replays only after `playing` has been false.
      if (!playing) {
        player.pause()
        finished.current = false
      } else if (!finished.current || loop) player.play()
      return
    }
    if (playOnHover) {
      const [start, end] = stableSegment ?? [0, player.totalFrames - 1]
      player.setMode(hovered ? 'forward' : 'reverse')
      const atRest = hovered ? player.currentFrame >= end - 0.5 : player.currentFrame <= start + 0.5
      if (!atRest) player.play()
      return
    }
    const wants = playOnView ? seen.current : autoplay
    if (wants && (!finished.current || loop)) player.play()
  }, [player, loads, k.reduced, posterFrame, stableSegment, inView, playing, playOnHover, hovered, playOnView, autoplay, loop])

  // Theme: bind color slots to tokens, re-resolve when the theme flips.
  const slotsKey = JSON.stringify(slots ?? {})
  const applyTheme = useCallback(() => {
    const probe = probeRef.current
    if (!player || !probe || !themed || !player.isLoaded) return
    const bindings = JSON.parse(slotsKey) as Record<string, string>
    const tokens = getComputedStyle(probe)
    let changed = false
    for (const id of player.getSlotIds()) {
      if (player.getSlotType(id) !== 'color') continue
      const binding = bindings[id] ?? id
      const isToken = tokens.getPropertyValue(`--color-${binding}`).trim() !== ''
      if (!isToken && !bindings[id]) continue
      const color = resolveColor(probe, isToken ? `var(--color-${binding})` : binding)
      if (color) changed = player.setColorSlot(id, color) || changed
    }
    // A paused player won't repaint on its own.
    if (changed && !player.isPlaying) player.setFrame(player.currentFrame)
  }, [player, themed, slotsKey])

  useEffect(() => {
    if (loads > 0) applyTheme()
  }, [applyTheme, loads])
  useThemeChange(rootRef, applyTheme)

  const hoverProps = playOnHover
    ? {
        onPointerEnter: () => setHovered(true),
        onPointerLeave: () => setHovered(false),
        onFocus: () => setHovered(true),
        onBlur: () => setHovered(false),
      }
    : {}

  return (
    <div
      ref={rootRef}
      className={cn('relative inline-block', className)}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...hoverProps}
      {...rest}
    >
      <span ref={probeRef} hidden />
      <DotLottieReact
        data={ready ? animation : undefined}
        loop={loop}
        speed={speed / k.timeScale}
        segment={stableSegment}
        layout={layout}
        renderConfig={RENDER_CONFIG}
        dotLottieRefCallback={setPlayer}
      />
    </div>
  )
}

function resolveFrame(frame: LottieFrame, player: DotLottie, segment?: [number, number]) {
  if (typeof frame === 'number') return frame
  const [start, end] = segment ?? [0, Math.max(0, player.totalFrames - 1)]
  return frame === 'first' ? start : end
}

let colorContext: CanvasRenderingContext2D | null | undefined

/** Resolve any CSS color (tokens, var(), oklch…) to the 0–1 RGBA a Lottie slot takes. */
function resolveColor(probe: HTMLElement, expression: string): [number, number, number, number] | null {
  probe.style.color = expression
  const computed = getComputedStyle(probe).color
  colorContext ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!colorContext || !computed) return null
  colorContext.clearRect(0, 0, 1, 1)
  colorContext.fillStyle = 'transparent'
  colorContext.fillStyle = computed
  colorContext.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0, a = 0] = colorContext.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255, a / 255]
}
