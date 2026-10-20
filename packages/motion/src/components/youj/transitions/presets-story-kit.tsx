import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useYoujScope } from '@youj/core/lib/youj/provider'

/* Storybook-only: reproduces the lifecycle Base UI drives, so the motion
 * presets can be shown without @youj/motion depending on Base UI.
 * Mount with [data-starting-style], drop it a frame later; on close set
 * [data-ending-style] and unmount once element.getAnimations() settle; a
 * reopen mid-close just drops the attribute so the transition reverses.
 * Not a registry item. @youj/react exercises the presets on real Base UI. */

export type Lifecycle = 'starting' | 'open' | 'ending'

/** `animateMount`: also animate when mounting already open, as Base UI toasts do. */
export function usePresence<T extends HTMLElement>(open: boolean, animateMount = false) {
  const ref = useRef<T>(null)
  const [mounted, setMounted] = useState(open && !animateMount)
  const [phase, setPhase] = useState<Lifecycle>('open')
  if (open && !mounted) {
    setMounted(true)
    setPhase('starting')
  }
  if (!open && mounted && phase !== 'ending') setPhase('ending')

  useLayoutEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => setPhase('open'))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (open || !mounted || phase !== 'ending') return
    let live = true
    const frame = requestAnimationFrame(() => {
      const el = ref.current
      // A transition canceled mid-flight rejects; wait for whatever replaced it.
      const settle = (): void => {
        Promise.all((el?.getAnimations() ?? []).map((a) => a.finished)).then(
          () => live && setMounted(false),
          () => live && settle(),
        )
      }
      settle()
    })
    return () => {
      live = false
      cancelAnimationFrame(frame)
    }
  }, [open, mounted, phase])

  const attrs = {
    'data-open': open ? '' : undefined,
    'data-closed': open ? undefined : '',
    'data-starting-style': phase === 'starting' ? '' : undefined,
    'data-ending-style': phase === 'ending' ? '' : undefined,
  }
  return { ref, mounted, attrs }
}

/** Renders into document.body, re-applying the provider's Speed and reduced motion there. */
export function Portal({ children }: { children: ReactNode }) {
  const scope = useYoujScope()
  const [host, setHost] = useState<HTMLElement | null>(null)
  useEffect(() => setHost(document.body), [])
  return host ? createPortal(<div {...scope}>{children}</div>, host) : null
}
