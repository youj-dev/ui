'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export type Phase = 'closed' | 'starting' | 'open' | 'ending'

/**
 * Base UI's lifecycle for a part that mounts and unmounts, so the real preset
 * classes play on the stage: mount with `data-starting-style`, drop it two
 * frames later, set `data-ending-style` on close and unmount once every
 * transition under `ref` has finished. Reopening mid-close only drops the
 * ending style, so the CSS transition turns back from where it is. With no
 * transitions to wait for (reduced motion), it unmounts at once.
 */
export function useLifecycle(open: boolean) {
  const [phase, setPhase] = useState<Phase>(open ? 'open' : 'closed')
  const ref = useRef<HTMLDivElement>(null)
  const reset = useCallback(() => setPhase('closed'), [])

  useLayoutEffect(() => {
    setPhase((p) => (open ? (p === 'closed' ? 'starting' : p === 'ending' ? 'open' : p) : p === 'closed' ? p : 'ending'))
  }, [open])

  useEffect(() => {
    if (phase === 'starting') {
      let second = 0
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setPhase((p) => (p === 'starting' ? 'open' : p)))
      })
      return () => {
        cancelAnimationFrame(first)
        cancelAnimationFrame(second)
      }
    }
    if (phase === 'ending') {
      let live = true
      // A frame for the ending style's transitions to start, then wait them out.
      const id = requestAnimationFrame(() => {
        const running = ref.current?.getAnimations?.({ subtree: true }) ?? []
        Promise.all(running.map((a) => a.finished)).then(
          () => live && setPhase((p) => (p === 'ending' ? 'closed' : p)),
          () => {},
        )
      })
      return () => {
        live = false
        cancelAnimationFrame(id)
      }
    }
  }, [phase])

  return {
    phase,
    mounted: phase !== 'closed',
    ref,
    /** Spread on every part that wears a preset. */
    attrs: {
      'data-starting-style': phase === 'starting' ? '' : undefined,
      'data-ending-style': phase === 'ending' ? '' : undefined,
    },
    /** Unmounts at once, for a replay that starts from closed. */
    reset,
  }
}
