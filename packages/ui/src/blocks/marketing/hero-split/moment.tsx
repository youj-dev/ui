'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'

/* What the demo window's parts share: the clock a part's moment plays on,
 * a slot that swaps between two states, and the parts' card styles. */

/** The beat a part is on: it plays from the first each time the camera arrives (`visit`), and rests on `rest` otherwise. */
export function useMoment(on: boolean, visit: number, beats: number, rest: number) {
  const k = useYouj()
  const [beat, setBeat] = useState(0)
  const key = on ? visit : -1
  const [prev, setPrev] = useState(key)
  if (prev !== key) {
    setPrev(key)
    setBeat(0)
  }
  useEffect(() => {
    if (!on || k.reduced) return
    const timers: ReturnType<typeof setTimeout>[] = []
    // The first beat waits for the camera to arrive; the rest come two slow beats apart.
    let t = k.ms('deliberate') * 1.2
    for (let b = 1; b <= beats; b++) {
      timers.push(setTimeout(() => setBeat(b), t))
      t += k.ms('slow') * 2.4
    }
    return () => timers.forEach(clearTimeout)
  }, [on, visit, beats, k])
  return on && !k.reduced ? beat : rest
}

/** Two states of one slot, laid over each other so the slot keeps the larger one's size. */
export function Swap({ on, off, onNode, className }: { on: boolean; off: ReactNode; onNode: ReactNode; className?: string }) {
  const fade = 'col-start-1 row-start-1 transition-[opacity,scale] yj-duration-base ease-standard'
  return (
    <span className={cn('grid', className)}>
      <span className={cn(fade, on ? 'scale-95 opacity-0' : 'opacity-100')}>{off}</span>
      <span className={cn(fade, on ? 'opacity-100' : 'scale-95 opacity-0')}>{onNode}</span>
    </span>
  )
}

export const card = 'flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-3.5'
export const label = 'text-ui-xs font-medium text-fg-muted'
