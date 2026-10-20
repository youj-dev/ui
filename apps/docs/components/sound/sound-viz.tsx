'use client'

import { useImperativeHandle, useRef, type Ref } from 'react'
import { cn, useYouj } from '@youj/core'

/* A sound, drawn: its envelope as bars (a square root of the peak per bar,
 * which reads closer to loudness than the raw amplitude), lit in accent as it
 * plays. The bars come from the render (or, for a file of your own, from
 * lab/process.ts), so nothing here decodes audio. */

export interface WaveformHandle {
  /** Lights the waveform left to right over `ms`, then lets it go. */
  play(ms: number): void
}

function Bars({ wave, className }: { wave: number[]; className?: string }) {
  return (
    <svg viewBox={`0 0 ${wave.length} 20`} preserveAspectRatio="none" className={cn('block h-full w-full', className)}>
      {wave.map((level, i) =>
        // Silence draws nothing: the center line under the bars carries the time.
        level > 0 ? <rect key={i} x={i + 0.18} y={10 - Math.max(Math.sqrt(level / 100) * 10, 0.6)} width={0.64} height={Math.max(Math.sqrt(level / 100) * 20, 1.2)} rx={0.32} fill="currentColor" /> : null,
      )}
    </svg>
  )
}

export function Waveform({ wave, className, ref }: { wave: number[]; className?: string; ref?: Ref<WaveformHandle> }) {
  const k = useYouj()
  const lit = useRef<HTMLDivElement>(null)
  useImperativeHandle(
    ref,
    () => ({
      play(ms) {
        const el = lit.current
        if (!el) return
        el.getAnimations().forEach((a) => a.cancel())
        // Reduced motion: no sweep, just lit for as long as it sounds.
        const frames = k.reduced
          ? [
              { clipPath: 'inset(0 0 0 0)', opacity: 1 },
              { clipPath: 'inset(0 0 0 0)', opacity: 1, offset: 0.999 },
              { clipPath: 'inset(0 0 0 0)', opacity: 0 },
            ]
          : [
              { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
              { clipPath: 'inset(0 0% 0 0)', opacity: 1, offset: ms / (ms + k.ms('base')) },
              { clipPath: 'inset(0 0% 0 0)', opacity: 0 },
            ]
        // Real audio time: the Speed control doesn't stretch a sound, so it doesn't stretch this.
        el.animate(frames, { duration: k.reduced ? ms : ms + k.ms('base'), easing: 'linear' })
      },
    }),
    [k],
  )
  return (
    <div aria-hidden className={cn('relative rtl:-scale-x-100', className)}>
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
      <Bars wave={wave} className="relative text-fg-subtle" />
      <div ref={lit} className="absolute inset-0 text-accent opacity-0">
        <Bars wave={wave} />
      </div>
    </div>
  )
}
