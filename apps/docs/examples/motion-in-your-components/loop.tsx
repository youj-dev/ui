'use client'

import { useEffect, useRef } from 'react'
import { useYouj } from '@youj/core'

const W = 320
const H = 72
const HISTORY = 12 // seconds on screen
const POINTS = 96

/** Deterministic traffic, a few sines, so the server and the client draw the same first frame. */
const traffic = (t: number) => 0.5 + 0.2 * Math.sin(t * 0.9) + 0.12 * Math.sin(t * 2.3 + 1) + 0.06 * Math.sin(t * 5.1 + 2)
const rps = (t: number) => Math.round(900 + traffic(t) * 800).toLocaleString('en-US')

function lineAt(time: number) {
  let d = ''
  for (let i = 0; i <= POINTS; i++) {
    const t = time - HISTORY + (i / POINTS) * HISTORY
    d += `${i ? 'L' : 'M'}${((i / POINTS) * W).toFixed(1)} ${(H - traffic(t) * H).toFixed(1)}`
  }
  return d
}

export default function LiveTraffic() {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const line = useRef<SVGPathElement>(null)
  const area = useRef<SVGPathElement>(null)
  const value = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const draw = (time: number) => {
      const d = lineAt(time)
      line.current?.setAttribute('d', d)
      area.current?.setAttribute('d', `${d}L${W} ${H}L0 ${H}Z`)
      if (value.current) value.current.textContent = rps(time)
    }

    // Reduced motion: no scrolling line. The chart still updates, in discrete steps.
    if (k.reduced) {
      let time = 0
      const step = setInterval(() => draw((time += 2)), k.ms('deliberate') * 4)
      return () => clearInterval(step)
    }

    let elapsed = 0
    let last = 0
    let frame = 0
    let onScreen = true
    const tick = (now: number) => {
      // Divide elapsed time by the time scale: at ¼ speed the chart really moves four times slower.
      elapsed += (now - last) / 1000 / k.timeScale
      last = now
      draw(elapsed)
      frame = requestAnimationFrame(tick)
    }
    const start = () => {
      if (frame || !onScreen || document.visibilityState === 'hidden') return
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }
    // Pause offscreen and in hidden tabs.
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true
      if (onScreen) start()
      else stop()
    })
    const onVisibility = () => (document.visibilityState === 'hidden' ? stop() : start())
    io.observe(root.current!)
    document.addEventListener('visibilitychange', onVisibility)
    start()
    return () => {
      stop()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [k])

  const first = lineAt(0)
  return (
    <div ref={root} className="w-full max-w-sm rounded-xl border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-fg">Requests</p>
        <p className="text-xs text-fg-muted">
          <span ref={value} className="font-mono text-sm text-fg tabular-nums">
            {rps(0)}
          </span>{' '}
          per second
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-18 w-full text-accent" preserveAspectRatio="none" aria-hidden>
        <path ref={area} d={`${first}L${W} ${H}L0 ${H}Z`} fill="currentColor" fillOpacity={0.08} />
        <path ref={line} d={first} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="mt-2 text-xs text-fg-muted">Last {HISTORY} seconds</p>
    </div>
  )
}
