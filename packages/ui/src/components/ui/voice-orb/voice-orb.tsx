'use client'

import { useEffect, useRef, type ComponentProps } from 'react'
import { observeThemeChange, type Size } from '@youj/core'
import { useComponentLabels, voiceOrbLabels } from '@youj/core/labels'
import { observeOnScreen } from '@youj/core/lib/youj/on-screen'
import { useYouj } from '@youj/core/lib/youj/provider'
import { springPhysics } from '@youj/core/lib/youj/tokens'
import { useAnnouncer } from '../../../hooks/use-announcer'
import { clamp, cn } from '../../../lib/utils'
import { createAudioMeter, type AudioMeter, type AudioReading, type AudioSource } from '../../../hooks/use-audio-meter'
import { createOrbRenderer, readInks, type OrbFrame, type OrbInks, type OrbRenderer } from './voice-orb-render'
import { createRings } from './voice-orb-rings'

/* A voice agent's presence: a clean, softly lit sphere in the theme's accent
 * (a light tint to a deep shade of it, with chart-2 as a hint), whose motion
 * says what the agent is doing and how loud it is. The sphere never changes
 * shape; the sound shows as rings and as the sphere's size.
 * - idle: a slow breath. listening: rings drawn in from the edge on a slow
 *   beat, the sphere swelling with the input. thinking: a calm swirl turns
 *   inside. speaking: pulses sent out with the output, one per rise, the
 *   sphere swelling with the low band. `muted` grays it and stops it hearing.
 *   Between states every quality springs over the deliberate token.
 * - Sound in: `level` (0–1, measured by the app) or `audio` (a stream, a media
 *   element or a node), analysed here with an AnalyserNode made only then.
 * - The halo and rings stay inside the box (the sphere is 62% of it) unless
 *   `spill`, which gives them half the size again beyond it.
 * - Drawn in WebGL2, else Canvas2D, else a CSS disc; 2× device pixels at most,
 *   60 frames a second at most, paused offscreen and in hidden tabs; colors
 *   re-read when the theme changes.
 * - Reduced motion: a still sphere that only scales gently with the level, no
 *   rings. The clock runs at 1 / the provider's timeScale. */

/** A microphone or call stream, an <audio>/<video> element, or a node in the app's own audio graph. */
type VoiceOrbAudio = AudioSource

type VoiceOrbState = 'idle' | 'listening' | 'thinking' | 'speaking'

/** Loudness per frequency band, each 0–1. */
interface VoiceOrbBands {
  low: number
  mid: number
  high: number
}

interface VoiceOrbProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What the agent is doing. Default `idle`. */
  state?: VoiceOrbState
  /** How loud, 0–1, for apps that measure their audio themselves: the input while listening, the output while speaking. Ignored while `audio` is set. */
  level?: number
  /** Loudness per band, 0–1: low swells the sphere, mid drives the rings. Default: every band follows `level`. Ignored while `audio` is set. */
  bands?: VoiceOrbBands
  /** A source to analyze instead of `level`: a MediaStream (a microphone, a call), an <audio> or <video> element, or an AudioNode. */
  audio?: VoiceOrbAudio | null
  /** The person's microphone is off: the sphere grays and stops reacting while listening. Default false. */
  muted?: boolean
  /** Let the halo and rings reach past the box, by half its size again; the sphere keeps its size. Default false. */
  spill?: boolean
  /** Default `default`. */
  size?: Extract<Size, 'sm' | 'default' | 'lg' | 'xl'>
  /** The agent's name, spoken with its state ("Ada: Listening"). Default: the labels' "Voice agent". */
  label?: string
}

/** Per state: breath, flow rate, rings, inner swirl, swell with the level, halo. Then muted, set from the prop. */
const TARGETS: Record<VoiceOrbState, readonly number[]> = {
  idle: [1, 0.2, 0, 0, 0.3, 0.45],
  listening: [0.4, 0.3, 1, 0, 1, 0.65],
  thinking: [0.5, 0.75, 0, 1, 0.2, 0.55],
  speaking: [0.25, 0.45, 1, 0.1, 0.8, 0.85],
}
const DIRECTION: Record<VoiceOrbState, number> = { idle: 0, listening: -1, thinking: 0, speaking: 1 }

const SIZES = { sm: 'own:size-16', default: 'own:size-28', lg: 'own:size-44', xl: 'own:size-64' } as const
/** The sphere's radius in its box, 0–1 (the box's half-width). */
const RADIUS = 0.62
/** How much larger the canvas is than the box when the rings spill. */
const SPILL = 1.5
const MAX_DPR = 2
const FRAME_MS = 1000 / 60
/** A reduced-motion frame shows the flow at this phase, still. */
const STILL = 12

function VoiceOrb({ state = 'idle', level, bands, audio, muted = false, spill = false, size = 'default', label, className, ...props }: VoiceOrbProps) {
  const k = useYouj()
  const labels = useComponentLabels(voiceOrbLabels)
  const { announce, announcer } = useAnnouncer()
  const hostRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const loopRef = useRef<{ invalidate(): void; setMeter(meter: AudioMeter | null): void } | null>(null)
  const settings = () => ({ state, level, bands, muted, spill, reduced: k.reduced, timeScale: k.timeScale, settle: k.duration('deliberate'), attack: k.duration('instant'), release: k.duration('slow'), gap: k.duration('fast') })
  const live = useRef(settings())

  const said = { idle: labels.voiceOrbIdle, listening: labels.voiceOrbListening, thinking: labels.voiceOrbThinking, speaking: labels.voiceOrbSpeaking }[state]
  const name = labels.voiceOrbState(label ?? labels.voiceOrb, muted ? labels.voiceOrbMuted(said) : said)

  useEffect(() => {
    live.current = settings()
    loopRef.current?.invalidate()
  })

  const announced = useRef(state)
  useEffect(() => {
    if (announced.current === state) return
    announced.current = state
    announce(said)
  }, [state, said, announce])

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    let inks: OrbInks = readInks(host)
    let meter: AudioMeter | null = null
    let raf = 0
    let last = 0
    let onScreen = true
    let alive = true
    let still = true
    let time = STILL

    const goal = () => [...TARGETS[live.current.state], live.current.muted ? 1 : 0]
    const x = Float64Array.from(goal())
    const v = new Float64Array(x.length)
    const heard: AudioReading = { level: 0, low: 0, mid: 0, high: 0 }
    const env = { level: 0, low: 0, mid: 0, high: 0 }
    const rings = createRings()
    const frame: OrbFrame = { flow: STILL * 0.3, radius: RADIUS, inner: 0, halo: 0, muted: 0, level: 0, rings: [] }

    const renderer: OrbRenderer | null = createOrbRenderer(canvas, () => {
      still = true
      invalidate()
    })
    host.dataset.yjRenderer = renderer?.kind ?? 'css'

    const measure = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const w = Math.max(1, Math.round(rect.width * dpr))
      if (canvas.width !== w) canvas.width = w
      if (canvas.height !== w) canvas.height = w
    }

    const animated = () => Boolean(renderer) && !live.current.reduced
    const running = () => alive && onScreen && (animated() || Boolean(meter))

    /** Moves every quality toward its target: springs for the state, an envelope for the sound, the rings on. */
    const step = (dt: number) => {
      const L = live.current
      const target = goal()
      if (dt === 0 || L.reduced) {
        x.set(target)
        v.fill(0)
      } else {
        const { stiffness, damping } = springPhysics({ visualDuration: L.settle, bounce: 0 })
        const n = Math.ceil(dt / (1 / 240))
        const h = dt / n
        for (let s = 0; s < n; s++) {
          for (let i = 0; i < x.length; i++) {
            v[i] = (v[i] ?? 0) + (stiffness * ((target[i] ?? 0) - (x[i] ?? 0)) - damping * (v[i] ?? 0)) * h
            x[i] = (x[i] ?? 0) + (v[i] ?? 0) * h
          }
        }
      }
      let input: AudioReading
      if (meter?.read(heard)) input = heard
      else {
        const lv = clamp(L.level ?? 0, 0, 1)
        input = { level: lv, low: clamp(L.bands?.low ?? lv, 0, 1), mid: clamp(L.bands?.mid ?? lv, 0, 1), high: clamp(L.bands?.high ?? lv, 0, 1) }
      }
      // A muted microphone hears nothing; the agent's own voice still shows.
      const deaf = L.muted && L.state === 'listening'
      for (const key of ['level', 'low', 'mid', 'high'] as const) {
        const value = deaf ? 0 : input[key]
        const tau = value > env[key] ? L.attack : L.release
        env[key] = dt === 0 ? value : env[key] + (value - env[key]) * (1 - Math.exp(-dt / Math.max(tau, 1e-3)))
      }
      if (L.reduced) rings.clear()
      else rings.step(dt, env.mid, x[2] ?? 0, DIRECTION[L.state], { gap: L.gap, life: L.settle * 2 })
      const scaled = dt / Math.max(L.timeScale, 1e-3)
      time += scaled
      frame.flow += scaled * (x[1] ?? 0)
    }

    const paint = () => {
      const L = live.current
      const [breath = 0, , , inner = 0, swell = 0, halo = 0, mute = 0] = x
      // Reduced motion and the CSS disc: the picture stands still and only its size follows the level.
      const body = bodyRef.current
      if (body) body.style.transform = animated() ? '' : `scale(${(1 + env.level * 0.08).toFixed(4)})`
      if (!renderer || (L.reduced && !still)) return
      const room = L.spill ? SPILL : 1
      const scale = L.reduced ? 1 : 1 + breath * 0.022 * Math.sin(time * 1.2) + swell * (env.level * 0.5 + env.low * 0.5) * 0.12
      frame.radius = (RADIUS / room) * scale
      frame.inner = inner
      frame.halo = halo
      frame.muted = mute
      frame.level = L.reduced ? 0 : env.level
      if (L.reduced) frame.flow = STILL * 0.3
      frame.rings = rings.rings(frame.radius, env.low)
      renderer.draw(frame, inks)
      still = false
    }

    const tick = (now: number) => {
      raf = 0
      if (!running()) return
      if (last && now - last < FRAME_MS - 2) {
        raf = requestAnimationFrame(tick)
        return
      }
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0
      last = now
      step(dt)
      paint()
      raf = requestAnimationFrame(tick)
    }

    const sync = () => {
      if (running()) {
        if (!raf) raf = requestAnimationFrame(tick)
        return
      }
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      last = 0
    }

    // Outside the loop (reduced motion, the CSS disc, offscreen), a change is drawn once.
    let queued = false
    const invalidate = () => {
      if (running()) return sync()
      if (queued) return
      queued = true
      raf = requestAnimationFrame(() => {
        raf = 0
        queued = false
        if (!alive) return
        step(0)
        still = true
        paint()
        sync()
      })
    }

    const stopTheme = observeThemeChange(host, () => {
      inks = readInks(host)
      still = true
      invalidate()
    })
    const stopScreen = observeOnScreen(host, (next) => {
      onScreen = next
      sync()
    }, { rootMargin: '64px' })
    const resize = new ResizeObserver(() => {
      measure()
      still = true
      invalidate()
    })
    resize.observe(canvas)
    measure()

    loopRef.current = {
      invalidate,
      setMeter(next) {
        meter = next
        invalidate()
      },
    }
    invalidate()

    return () => {
      alive = false
      if (raf) cancelAnimationFrame(raf)
      loopRef.current = null
      stopTheme()
      stopScreen()
      resize.disconnect()
      renderer?.dispose()
      delete host.dataset.yjRenderer
    }
  }, [])

  useEffect(() => {
    if (!audio) return
    const meter = createAudioMeter(audio)
    loopRef.current?.setMeter(meter)
    return () => {
      loopRef.current?.setMeter(null)
      meter?.dispose()
    }
  }, [audio])

  return (
    <div
      ref={hostRef}
      data-slot="voice-orb"
      data-state={state}
      data-size={size}
      data-yj-muted={muted || undefined}
      className={cn('group/voice-orb own:relative own:inline-flex own:shrink-0', SIZES[size], className)}
      {...props}
    >
      <div ref={bodyRef} role="img" aria-label={name} data-slot="voice-orb-body" className="relative size-full transition-transform yj-duration-fast ease-standard">
        <div
          aria-hidden
          data-slot="voice-orb-fallback"
          className="absolute inset-[19%] rounded-full bg-[radial-gradient(circle_at_34%_30%,color-mix(in_oklab,var(--color-accent)_55%,white),var(--color-accent)_55%,color-mix(in_oklab,var(--color-accent)_70%,black))] group-data-[yj-muted]/voice-orb:grayscale group-data-[yj-renderer=canvas]/voice-orb:hidden group-data-[yj-renderer=webgl]/voice-orb:hidden"
        />
        <canvas ref={canvasRef} aria-hidden className={cn('pointer-events-none absolute', spill ? '-inset-1/4 size-[150%]' : 'inset-0 size-full')} />
      </div>
      {announcer}
    </div>
  )
}

export { VoiceOrb, type VoiceOrbAudio, type VoiceOrbBands, type VoiceOrbProps, type VoiceOrbState }
