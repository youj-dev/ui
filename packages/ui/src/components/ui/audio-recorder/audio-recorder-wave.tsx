'use client'

import { useImperativeHandle, useRef, type Ref } from 'react'
import { cn } from '../../../lib/utils'

/* The sound as it's recorded. A strip of bars, one per sample, the newest at
 * the end, sliding toward the start by a fraction of a bar each frame so the
 * strip scrolls smoothly between samples; the space before the first sample is
 * a flat line. Under reduced motion it is a still level meter instead: a row
 * of bars of rising height that light up to the current level. Drawn straight
 * into the DOM by the recorder's frame loop, never through React state. Time
 * runs left to right in every script, like the WaveformScrubber it becomes. */

export interface LiveWaveHandle {
  /** `samples` oldest first; `offset` (0–1) how far into the next sample; `level` the loudness now. */
  draw(samples: readonly number[], offset: number, level: number): void
}

/** Bars across the strip. */
export const WAVE_BARS = 72
const METER_BARS = 24
const f = (n: number) => Math.round(n * 100) / 100

function wavePath(samples: readonly number[], offset: number) {
  let d = ''
  for (let e = 0; e <= WAVE_BARS; e++) {
    const level = samples[samples.length - 1 - e] ?? 0
    const x = WAVE_BARS - 0.5 - offset - e
    const half = 4 + Math.min(1, Math.max(0, level)) * 42
    d += `M${f(x)} ${f(50 - half)}V${f(50 + half)}`
  }
  return d
}

interface LiveWaveProps {
  ref?: Ref<LiveWaveHandle>
  reduced: boolean
  tone: 'idle' | 'live' | 'paused'
}

function LiveWave({ ref, reduced, tone }: LiveWaveProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const meterRef = useRef<HTMLDivElement>(null)
  const stroke = tone === 'live' ? 'stroke-fg' : tone === 'paused' ? 'stroke-fg-muted' : 'stroke-line-strong'

  useImperativeHandle(ref, () => ({
    draw(samples, offset, level) {
      pathRef.current?.setAttribute('d', wavePath(samples, offset))
      const lit = Math.round(Math.min(1, Math.max(0, level)) * METER_BARS)
      meterRef.current?.querySelectorAll<HTMLElement>('[data-slot=audio-recorder-meter-bar]').forEach((bar, i) => {
        bar.toggleAttribute('data-yj-lit', i < lit)
      })
    },
  }))

  if (reduced) {
    return (
      <div ref={meterRef} aria-hidden dir="ltr" data-slot="audio-recorder-meter" className="own:flex h-16 w-full items-center justify-center gap-1.5">
        {Array.from({ length: METER_BARS }, (_, i) => (
          <span
            key={i}
            data-slot="audio-recorder-meter-bar"
            className={cn('w-1 rounded-full own:bg-line-strong', tone === 'live' ? 'own:data-yj-lit:bg-fg' : 'own:data-yj-lit:bg-fg-muted')}
            style={{ height: `${25 + (75 * i) / (METER_BARS - 1)}%` }}
          />
        ))}
      </div>
    )
  }

  return (
    <svg aria-hidden data-slot="audio-recorder-wave" viewBox={`0 0 ${WAVE_BARS} 100`} preserveAspectRatio="none" className="h-16 w-full overflow-hidden">
      <path ref={pathRef} d={wavePath([], 0)} className={stroke} strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" fill="none" />
    </svg>
  )
}

export { LiveWave }
