'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { YoujProvider } from '@youj/core'
import type { YoujIconComponent } from '@youj/icons'

/* Onion skins of a state icon's real transition. An invisible copy of the
 * icon plays rest → active once, with motion on at normal speed whatever the
 * page's settings (nothing on screen moves), and its SVG is read every frame
 * until it settles. Motion writes every animated value inline (path data,
 * transforms, dash lengths), so each reading is that frame, exactly. */

export interface RecordedFrame {
  /** ms after the switch to active. */
  t: number
  /** The icon's inner SVG at that moment, its ids made unique to the frame. */
  markup: string
}

export interface TransitionRecording {
  /** Evenly spaced moments between rest and active (both excluded), or none yet. */
  frames: RecordedFrame[]
  /** When the icon stopped changing, ms. */
  duration: number
  /** Render this anywhere: the invisible copy that plays the transition. */
  recorder: ReactNode
}

/** Frames held still this long mean the transition is over. */
const SETTLED = 12
const MAX_MS = 2400

export function useTransitionRecording(Icon: YoujIconComponent, count = 6): TransitionRecording {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const host = useRef<HTMLSpanElement>(null)
  // Active only for the icon being recorded: a new icon starts at rest in the same render.
  const [activeFor, setActiveFor] = useState<YoujIconComponent | null>(null)
  const [result, setResult] = useState<{ Icon: YoujIconComponent; frames: RecordedFrame[]; duration: number } | null>(null)

  // Once the rest pose has painted, switch to active and read every frame until it settles.
  useEffect(() => {
    let raf = 0
    let start = 0
    let still = 0
    let last = ''
    const readings: RecordedFrame[] = []
    const read = (now: number) => {
      const markup = host.current?.querySelector('svg')?.innerHTML ?? ''
      if (!start) start = now
      const t = now - start
      if (markup !== last) {
        readings.push({ t, markup })
        last = markup
        still = 0
      } else if (readings.length > 1) {
        still++
      }
      if ((still >= SETTLED && readings.length > 1) || t > MAX_MS) {
        const end = readings[readings.length - 1]!.t
        setResult({ Icon, frames: pick(readings, end, count, uid), duration: Math.round(end) })
        return
      }
      raf = requestAnimationFrame(read)
    }
    // Two frames in, the fresh copy has painted its rest pose.
    const begin = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        last = host.current?.querySelector('svg')?.innerHTML ?? ''
        // A component is a function: wrap it, or React calls it as an updater.
        setActiveFor(() => Icon)
        raf = requestAnimationFrame(read)
      })
    })
    return () => {
      cancelAnimationFrame(begin)
      cancelAnimationFrame(raf)
    }
  }, [Icon, count, uid])

  const done = result?.Icon === Icon ? result : null
  return {
    frames: done?.frames ?? [],
    duration: done?.duration ?? 0,
    recorder: (
      <span ref={host} aria-hidden className="pointer-events-none invisible absolute top-0 left-0 size-6 overflow-hidden">
        <YoujProvider reducedMotion="never" timeScale={1}>
          <Icon key={Icon.meta.name} size={24} active={activeFor === Icon} />
        </YoujProvider>
      </span>
    ),
  }
}

/** `count` readings at even times between the first and the last, each with ids of its own (masks and clips). */
function pick(readings: RecordedFrame[], end: number, count: number, uid: string): RecordedFrame[] {
  const out: RecordedFrame[] = []
  for (let k = 1; k <= count; k++) {
    const at = (end * k) / (count + 1)
    let reading = readings[0]!
    for (const r of readings) {
      if (r.t > at) break
      reading = r
    }
    const suffix = `-${uid}f${k}`
    const markup = reading.markup.replace(/\bid="([^"]+)"/g, `id="$1${suffix}"`).replace(/url\(#([^)]+)\)/g, `url(#$1${suffix})`)
    out.push({ t: Math.round(at), markup })
  }
  return out
}
