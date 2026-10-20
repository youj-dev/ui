'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'

/**
 * A playhead for motion the stage doesn't drive itself (a component's own
 * spring, a CSS preset): the time since `start()`, in the token's
 * milliseconds (real time divided by the time scale), every frame until
 * `until`. A hidden tab gets no frames, so it lands on the end when shown.
 */
export function useClock(onTick: (t: number) => void) {
  const tick = useRef(onTick)
  tick.current = onTick
  const frame = useRef(0)

  const stop = useCallback(() => cancelAnimationFrame(frame.current), [])

  const start = useCallback(
    (scale: number, until: number) => {
      stop()
      const t0 = performance.now()
      const step = (now: number) => {
        const t = Math.min((now - t0) / scale, until)
        tick.current(t)
        if (t < until) frame.current = requestAnimationFrame(step)
      }
      tick.current(0)
      frame.current = requestAnimationFrame(step)
    },
    [stop],
  )

  useEffect(() => stop, [stop])
  return useMemo(() => ({ start, stop }), [start, stop])
}
